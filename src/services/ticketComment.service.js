const { ticketCommentRepository } = require('../repositories/ticketComment.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { auditService } = require('./audit.service');
const { notificationService } = require('./notification.service');
const { ticketService } = require('./ticket.service');
const { NotFoundError } = require('../utils/errors');

const ticketCommentService = {
  async create(ticketId, payload, user) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');

    ticketService.ensureCanComment(ticket, user);

    const comment = await ticketCommentRepository.create({
      ticketId,
      userId: user.id,
      comment: payload.comment,
      isInternal: user.role === 'CLIENT' ? false : Boolean(payload.isInternal)
    });

    await auditService.record({
      userId: user.id,
      action: 'TICKET_COMMENT_CREATED',
      entity: 'Ticket',
      entityId: ticketId,
      newValue: { commentId: comment.id }
    });

    const recipients = [ticket.client, ticket.assignedTechnician].filter((recipient) => recipient?.id !== user.id);

    await notificationService.notifyUsers({
      event: 'NEW_COMMENT',
      title: 'Nuevo comentario',
      message: `Hay un nuevo comentario en el ticket ${ticket.code}.`,
      recipients,
      entityType: 'Ticket',
      entityId: ticketId
    });

    return comment;
  }
};

module.exports = { ticketCommentService };
