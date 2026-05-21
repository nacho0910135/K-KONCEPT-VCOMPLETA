const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const calculateCronExpression = (frequency) => {
  const expressions = {
    DAILY: '0 7 * * *',
    WEEKLY: '0 7 * * 1',
    MONTHLY: '0 7 1 * *'
  };

  return expressions[frequency];
};

const calculateNextRunAt = (frequency, from = new Date()) => {
  const next = new Date(from);
  next.setHours(7, 0, 0, 0);

  if (next <= from) {
    if (frequency === 'DAILY') return addDays(next, 1);
    if (frequency === 'WEEKLY') return addDays(next, 7);
    if (frequency === 'MONTHLY') {
      next.setMonth(next.getMonth() + 1, 1);
      return next;
    }
  }

  if (frequency === 'WEEKLY') {
    const day = next.getDay();
    const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7;
    return addDays(next, daysUntilMonday);
  }

  if (frequency === 'MONTHLY') {
    next.setDate(1);
    if (next <= from) next.setMonth(next.getMonth() + 1, 1);
    return next;
  }

  return next;
};

module.exports = { calculateCronExpression, calculateNextRunAt };
