const { appointmentService } = require('../services/appointment.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => {
  const appointment = await appointmentService.create(req.params.ticketId, req.body, req.user);
  return successResponse(res, {
    statusCode: 201,
    data: { appointment },
    message: 'Cita agendada correctamente'
  });
};

const reschedule = async (req, res) => {
  const appointment = await appointmentService.reschedule(req.params.ticketId, req.body, req.user);
  return successResponse(res, {
    data: { appointment },
    message: 'Cita reprogramada correctamente'
  });
};

const availability = async (req, res) => {
  const slots = await appointmentService.getAvailability(req.query);
  return successResponse(res, { data: { slots } });
};

const complete = async (req, res) => {
  const appointment = await appointmentService.complete(req.params.id, req.user);
  return successResponse(res, {
    data: { appointment },
    message: 'Cita completada correctamente'
  });
};

const cancel = async (req, res) => {
  const appointment = await appointmentService.cancel(req.params.id, req.user);
  return successResponse(res, {
    data: { appointment },
    message: 'Cita cancelada correctamente'
  });
};

module.exports = { create, reschedule, availability, complete, cancel };
