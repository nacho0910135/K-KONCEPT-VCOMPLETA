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
      action: 'COMMENT_ADDED',
      entity: 'Ticket',
      entityId: ticketId,
      newValue: { commentId: comment.id }
    });

    const recipients = [ticket.client, ticket.assignedTechnician].filter((recipient) => recipient?.id !== user.id);

    await notificationService.notifyUsers({
      event: 'NEW_COMMENT',
      recipients,
      entityType: 'Ticket',
      entityId: ticketId,
      payload: {
        ticketCode: ticket.code,
        ticketTitle: ticket.title,
        commentAuthor: user.name,
        commentText: payload.comment
      }
    });

    return comment;
  }
};

module.exports = { ticketCommentService };
