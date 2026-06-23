const { refundRepository } = require('../repositories/refund.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { auditService } = require('./audit.service');
const { exportPdf } = require('../utils/pdfExporter.util');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

const assertTicketAccess = (ticket, user) => {
  if (user.role === 'ADMIN' || ticket.assignedTechnicianId === user.id || ticket.clientId === user.id) return;
  throw new ForbiddenError('No tiene acceso a este reembolso');
};

const refundService = {
  async createForTicket(ticketId, payload, user) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');
    assertTicketAccess(ticket, user);

    const refund = await refundRepository.create({
      ticketId,
      requestedById: user.id,
      type: payload.type,
      amount: payload.amount || null,
      reason: payload.reason
    });

    await auditService.record({
      userId: user.id,
      action: 'REFUND_REGISTERED',
      entity: 'Refund',
      entityId: refund.id,
      newValue: { ticketId, type: refund.type, amount: refund.amount }
    });

    return refund;
  },

  list(user) {
    return refundRepository.list(user.role === 'TECHNICIAN' ? { requestedById: user.id } : {});
  },

  async exportListPdf(user) {
    const refunds = await this.list(user);
    const buffer = await exportPdf({
      title: 'Lista de reembolsos',
      columns: [
        { header: 'Ticket', value: (row) => row.ticket?.code },
        { header: 'Cliente', value: (row) => row.ticket?.client?.name },
        { header: 'Tipo', value: 'type' },
        { header: 'Monto', value: (row) => row.amount || '' },
        { header: 'Estado', value: 'status' },
        { header: 'Razon', value: 'reason' }
      ],
      rows: refunds
    });

    return {
      buffer,
      filename: `reembolsos-${new Date().toISOString().slice(0, 10)}.pdf`
    };
  }
};

module.exports = { refundService };
