const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);

const getValue = (payload, key) => key.split('.').reduce((acc, part) => (
  acc && acc[part] !== undefined && acc[part] !== null ? acc[part] : ''
), payload);

const renderTemplate = (template, payload = {}, { escape = false } = {}) => (
  String(template || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
    const value = getValue(payload, key);
    return escape ? escapeHtml(value) : String(value);
  })
);

module.exports = { renderTemplate, escapeHtml };
