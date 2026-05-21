const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const exportExcel = ({ columns, rows, title = 'Reporte' }) => {
  const headers = columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('');
  const body = rows.map((row) => `<tr>${columns.map((column) => {
    const value = typeof column.value === 'function' ? column.value(row) : row[column.value || column.key];
    return `<td>${escapeHtml(value instanceof Date ? value.toISOString() : value)}</td>`;
  }).join('')}</tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"></head><body><h1>${escapeHtml(title)}</h1><table border="1"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`;
};

module.exports = { exportExcel };
