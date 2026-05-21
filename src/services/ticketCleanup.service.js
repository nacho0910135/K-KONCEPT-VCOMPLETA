const { ticketRepository } = require('../repositories/ticket.repository');
const { userRepository } = require('../repositories/user.repository');
const { NotFoundError } = require('../utils/errors');

const AUTO_CLOSE_COMMENT = 'Cierre automático por inactividad tras 5 días en RESOLVED';
const INACTIVITY_DAYS = 5;

const ticketCleanupService = {
  async closeInactiveResolvedTickets() {
    const systemUser = await userRepository.findSystemUser();

    if (!systemUser) {
      throw new NotFoundError('Usuario sistema requerido no existe. Ejecute el seed.');
    }

    const cutoffDate = new Date(Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
    const tickets = await ticketRepository.findResolvedInactiveBefore(cutoffDate);
    const closedTickets = await ticketRepository.closeResolvedTickets(
      tickets.map((ticket) => ticket.id),
      systemUser.id,
      AUTO_CLOSE_COMMENT
    );

    return {
      cutoffDate,
      candidates: tickets.length,
      closed: closedTickets.length
    };
  }
};

module.exports = { ticketCleanupService };
