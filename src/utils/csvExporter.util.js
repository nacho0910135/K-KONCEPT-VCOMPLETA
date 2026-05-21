const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const exportCsv = ({ columns, rows, metadata = [] }) => {
  const headerLines = metadata.map((line) => `# ${line}`);
  const columnLine = columns.map((column) => escapeCsvValue(column.header)).join(',');
  const rowLines = rows.map((row) => columns.map((column) => {
    const value = typeof column.value === 'function' ? column.value(row) : row[column.value || column.key];
    return escapeCsvValue(value);
  }).join(','));

  return [...headerLines, columnLine, ...rowLines].join('\n');
};

module.exports = { exportCsv };
