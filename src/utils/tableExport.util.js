const escapeCsvCell = (value) => String(value ?? '').replace(/"/g, '""');
const escapeHtmlCell = (value) => String(value ?? '').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));

const rowsFor = (columns, rows) => rows.map((row) => columns.map((column) => {
  const value = typeof column.value === 'function' ? column.value(row) : row[column.value];
  return value ?? '';
}));

const exportTable = ({ columns, rows, filename, format }) => {
  const headers = columns.map((column) => column.header);
  const data = [headers, ...rowsFor(columns, rows)];

  if (format === 'xls') {
    const htmlRows = data.map((row, index) => `<tr>${row.map((cell) => index === 0 ? `<th>${escapeHtmlCell(cell)}</th>` : `<td>${escapeHtmlCell(cell)}</td>`).join('')}</tr>`).join('');
    return {
      buffer: Buffer.from(`\uFEFF<html><head><meta charset="utf-8" /></head><body><table border="1">${htmlRows}</table></body></html>`, 'utf8'),
      contentType: 'application/vnd.ms-excel',
      filename: `${filename}.xls`
    };
  }

  return {
    buffer: Buffer.from(`\uFEFFsep=;\n${data.map((row) => row.map((cell) => `"${escapeCsvCell(cell)}"`).join(';')).join('\n')}`, 'utf8'),
    contentType: 'text/csv; charset=utf-8',
    filename: `${filename}.csv`
  };
};

module.exports = { exportTable };
