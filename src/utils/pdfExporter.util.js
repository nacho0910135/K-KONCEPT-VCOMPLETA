const PDFDocument = require('pdfkit');

const cell = (value) => String(value ?? '').replace(/\s+/g, ' ').slice(0, 90);

const exportPdf = ({ title = 'Reporte', columns, rows }) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 28, size: 'A4', layout: 'landscape' });
  const chunks = [];
  const visibleColumns = columns.slice(0, 8);
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = tableWidth / Math.max(1, visibleColumns.length);
  let y = 88;

  const header = () => {
    doc.fillColor('#dc2626').fontSize(9).font('Helvetica-Bold').text('KOLLAB KONCEPTS', 28, 24);
    doc.fillColor('#111827').fontSize(16).text(title, 28, 42);
    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-CR')}`, 28, 64);
    doc.roundedRect(28, y, tableWidth, 24, 4).fill('#f8fafc');
    visibleColumns.forEach((column, index) => {
      doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold').text(column.header, 32 + index * colWidth, y + 8, { width: colWidth - 8 });
    });
    y += 28;
  };

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  header();
  rows.slice(0, 500).forEach((row, rowIndex) => {
    if (y > doc.page.height - 48) {
      doc.addPage();
      y = 88;
      header();
    }
    if (rowIndex % 2 === 0) doc.rect(28, y - 4, tableWidth, 22).fill('#fbfbfb');
    visibleColumns.forEach((column, index) => {
      const value = typeof column.value === 'function' ? column.value(row) : row[column.value || column.key];
      doc.fillColor('#374151').fontSize(7).font('Helvetica').text(cell(value), 32 + index * colWidth, y, { width: colWidth - 8, height: 18 });
    });
    y += 22;
  });

  if (rows.length > 500 || columns.length > visibleColumns.length) {
    doc.moveDown().fillColor('#64748b').fontSize(8).text(`Vista PDF resumida: ${Math.min(rows.length, 500)} de ${rows.length} filas y ${visibleColumns.length} de ${columns.length} columnas. Use CSV/Excel para detalle completo.`);
  }

  doc.end();
});

module.exports = { exportPdf };
