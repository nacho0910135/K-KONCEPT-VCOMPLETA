const sanitizePlainText = (value) => {
  if (typeof value !== 'string') return value;

  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
};

const sanitizePayloadText = (payload, fields) => {
  const sanitized = { ...payload };

  fields.forEach((field) => {
    if (field in sanitized) {
      sanitized[field] = sanitizePlainText(sanitized[field]);
    }
  });

  return sanitized;
};

module.exports = {
  sanitizePlainText,
  sanitizePayloadText
};
