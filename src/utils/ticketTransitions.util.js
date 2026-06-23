const ALLOWED_TRANSITIONS = {
  CLIENT: {
    RESOLVED: ['CLOSED', 'REOPENED']
  },
  TECHNICIAN: {
    OPEN: ['PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CANCELLED'],
    PENDING: ['IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CANCELLED'],
    IN_PROGRESS: ['WAITING_CUSTOMER', 'RESOLVED', 'CANCELLED'],
    WAITING_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    REOPENED: ['IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CANCELLED']
  },
  ADMIN: {
    OPEN: ['PENDING', 'CANCELLED'],
    PENDING: ['CANCELLED'],
    IN_PROGRESS: ['CANCELLED'],
    WAITING_CUSTOMER: ['CANCELLED'],
    RESOLVED: ['CANCELLED'],
    REOPENED: ['PENDING', 'CANCELLED']
  },
  SYSTEM: {
    RESOLVED: ['CLOSED']
  }
};

const canTransition = (from, to, role) => {
  const roleTransitions = ALLOWED_TRANSITIONS[role] || {};
  const allowedFromSpecific = roleTransitions[from] || [];
  const allowedFromAny = roleTransitions['*'] || [];

  return [...allowedFromSpecific, ...allowedFromAny].includes(to);
};

module.exports = { ALLOWED_TRANSITIONS, canTransition };
