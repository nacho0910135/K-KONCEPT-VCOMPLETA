const ALLOWED_TRANSITIONS = {
  CLIENT: {
    RESOLVED: ['CLOSED', 'REOPENED']
  },
  TECHNICIAN: {
    OPEN: ['IN_PROGRESS'],
    PENDING: ['IN_PROGRESS'],
    IN_PROGRESS: ['PENDING', 'WAITING_CUSTOMER', 'RESOLVED'],
    WAITING_CUSTOMER: ['RESOLVED']
  },
  ADMIN: {
    '*': ['CANCELLED']
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
