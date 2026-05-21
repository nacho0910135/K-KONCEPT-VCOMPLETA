const { env } = require('../config/env');

const isWithinWorkingHours = (date, options = env.appointments) => {
  const value = new Date(date);
  const day = value.getDay();
  const hour = value.getHours();
  const minutes = value.getMinutes();

  if (!options.workDays.includes(day)) return false;
  if (hour < options.workStartHour) return false;
  if (hour >= options.workEndHour) return false;

  const end = new Date(value.getTime() + options.slotMinutes * 60 * 1000);
  const endHour = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);

  if (endHour > options.workEndHour) return false;
  return minutes === 0 || minutes === 30;
};

const getSlotRange = (date, slotMinutes = env.appointments.slotMinutes) => {
  const start = new Date(date);
  const end = new Date(start.getTime() + slotMinutes * 60 * 1000);
  return { start, end };
};

const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const generateWorkingSlotsForDay = (date, options = env.appointments) => {
  const slots = [];
  const base = new Date(date);
  base.setHours(options.workStartHour, 0, 0, 0);

  const end = new Date(date);
  end.setHours(options.workEndHour, 0, 0, 0);

  for (let cursor = new Date(base); cursor < end; cursor = new Date(cursor.getTime() + options.slotMinutes * 60 * 1000)) {
    const slotEnd = new Date(cursor.getTime() + options.slotMinutes * 60 * 1000);
    if (slotEnd <= end && isWithinWorkingHours(cursor, options)) {
      slots.push({ start: new Date(cursor), end: slotEnd });
    }
  }

  return slots;
};

module.exports = {
  isWithinWorkingHours,
  getSlotRange,
  getDayRange,
  generateWorkingSlotsForDay
};
