const { ConflictError, BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');
const { env } = require('../config/env');
const { appointmentRepository } = require('../repositories/appointment.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { userRepository } = require('../repositories/user.repository');
const { auditService } = require('./audit.service');
const { notificationService } = require('./notification.service');
const {
  isWithinWorkingHours,
  getSlotRange,
  getDayRange,
  generateWorkingSlotsForDay
} = require('../utils/workingHours.util');

const RESCHEDULABLE_TICKET_STATUSES = ['IN_PROGRESS', 'PENDING', 'WAITING_CUSTOMER'];

const ensureFutureWorkingSlot = (date) => {
  if (new Date(date) <= new Date()) {
    throw new BadRequestError('No se permiten citas en el pasado');
  }

  if (!isWithinWorkingHours(date)) {
    throw new BadRequestError('La cita debe estar dentro del horario laboral configurado');
  }
};

const ensureTechnician = async (technicianId) => {
  const technician = await userRepository.findActiveTechnicianById(technicianId);
  if (!technician) throw new BadRequestError('El tecnico indicado no existe o no esta activo');
  return technician;
};

const ensureNoOverlap = async ({ technicianId, date, excludeId }) => {
  const { start, end } = getSlotRange(date);
  const overlap = await appointmentRepository.findOverlapping({
    technicianId,
    start,
    end,
    slotMinutes: env.appointments.slotMinutes,
    excludeId
  });

  if (overlap) {
    throw new ConflictError('Seleccione otra fecha disponible');
  }
};

const assertTicketAccessForScheduling = (ticket, user) => {
  if (user.role === 'ADMIN') return;
  if (user.role === 'TECHNICIAN' && ticket.assignedTechnicianId === user.id) return;
  throw new ForbiddenError('No tiene permisos para agendar citas en este ticket');
};

const assertAppointmentAccess = (appointment, user) => {
  if (user.role === 'ADMIN') return;
  if (user.role === 'TECHNICIAN' && appointment.technicianId === user.id) return;
  if (user.role === 'CLIENT' && appointment.ticket.clientId === user.id) return;
  throw new ForbiddenError('No tiene acceso a esta cita');
};

const appointmentService = {
  async create(ticketId, payload, user) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');
    if (['CLOSED', 'CANCELLED'].includes(ticket.status)) {
      throw new BadRequestError('No se pueden agendar citas en tickets cerrados o cancelados');
    }

    assertTicketAccessForScheduling(ticket, user);
    await ensureTechnician(payload.technicianId);
    ensureFutureWorkingSlot(payload.appointmentDate);
    await ensureNoOverlap({ technicianId: payload.technicianId, date: payload.appointmentDate });

    const appointment = await appointmentRepository.create({
      ticketId,
      technicianId: payload.technicianId,
      appointmentDate: payload.appointmentDate,
      reason: payload.reason,
      status: 'SCHEDULED',
      createdById: user.id
    });

    await auditService.record({
      userId: user.id,
      action: 'APPOINTMENT_SCHEDULED',
      entity: 'Appointment',
      entityId: appointment.id,
      newValue: { ticketId, appointmentDate: payload.appointmentDate }
    });

    return appointment;
  },

  async reschedule(ticketId, payload, user) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');
    if (ticket.clientId !== user.id) throw new ForbiddenError('Solo el cliente solicitante puede reprogramar esta cita');
    if (!RESCHEDULABLE_TICKET_STATUSES.includes(ticket.status)) {
      throw new BadRequestError('Solo se pueden reprogramar citas de tickets en progreso, pendientes o esperando cliente');
    }

    const appointment = await appointmentRepository.findLatestActiveByTicketId(ticketId);
    if (!appointment) throw new NotFoundError('No hay una cita activa para reprogramar');

    ensureFutureWorkingSlot(payload.newDate);
    await ensureNoOverlap({
      technicianId: appointment.technicianId,
      date: payload.newDate,
      excludeId: appointment.id
    });

    const updated = await appointmentRepository.update(appointment.id, {
      appointmentDate: payload.newDate,
      originalDate: appointment.appointmentDate,
      rescheduleReason: payload.reason,
      status: 'RESCHEDULED'
    });

    await notificationService.notifyUsers({
      event: 'APPOINTMENT_RESCHEDULED',
      title: 'Cita reprogramada',
      message: `La cita del ticket ${ticket.code} fue reprogramada.`,
      recipients: [ticket.client, appointment.technician],
      entityType: 'Appointment',
      entityId: appointment.id
    });

    await auditService.record({
      userId: user.id,
      action: 'APPOINTMENT_RESCHEDULED',
      entity: 'Appointment',
      entityId: appointment.id,
      previousValue: { appointmentDate: appointment.appointmentDate },
      newValue: { appointmentDate: payload.newDate, reason: payload.reason }
    });

    return updated;
  },

  async getAvailability({ date, technicianId }) {
    await ensureTechnician(technicianId);
    const { start: dayStart, end: dayEnd } = getDayRange(date);
    const appointments = await appointmentRepository.findActiveForDay({ technicianId, dayStart, dayEnd });
    const slots = generateWorkingSlotsForDay(date);

    return slots.map((slot) => {
      const isBooked = appointments.some((appointment) => {
        const appointmentStart = appointment.appointmentDate.getTime();
        const appointmentEnd = getSlotRange(appointment.appointmentDate).end.getTime();
        return appointmentStart < slot.end.getTime() && appointmentEnd > slot.start.getTime();
      });

      return {
        start: slot.start,
        end: slot.end,
        available: !isBooked && slot.start > new Date()
      };
    });
  },

  async complete(id, user) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) throw new NotFoundError('Cita no encontrada');
    assertAppointmentAccess(appointment, user);

    if (user.role === 'CLIENT') throw new ForbiddenError('El cliente no puede completar citas');
    if (!['SCHEDULED', 'RESCHEDULED'].includes(appointment.status)) {
      throw new BadRequestError('Solo se pueden completar citas activas');
    }

    const updated = await appointmentRepository.update(id, { status: 'COMPLETED' });

    await auditService.record({
      userId: user.id,
      action: 'APPOINTMENT_COMPLETED',
      entity: 'Appointment',
      entityId: id,
      previousValue: { status: appointment.status },
      newValue: { status: 'COMPLETED' }
    });

    return updated;
  },

  async cancel(id, user) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) throw new NotFoundError('Cita no encontrada');
    assertAppointmentAccess(appointment, user);

    if (user.role === 'CLIENT') throw new ForbiddenError('El cliente no puede cancelar citas desde este endpoint');
    if (!['SCHEDULED', 'RESCHEDULED'].includes(appointment.status)) {
      throw new BadRequestError('Solo se pueden cancelar citas activas');
    }

    const updated = await appointmentRepository.update(id, { status: 'CANCELLED' });

    await auditService.record({
      userId: user.id,
      action: 'APPOINTMENT_CANCELLED',
      entity: 'Appointment',
      entityId: id,
      previousValue: { status: appointment.status },
      newValue: { status: 'CANCELLED' }
    });

    return updated;
  }
};

module.exports = { appointmentService };
