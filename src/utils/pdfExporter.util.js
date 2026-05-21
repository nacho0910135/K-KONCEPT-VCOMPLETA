const PDFDocument = require('pdfkit');

const exportPdf = ({ title = 'Reporte', columns, rows }) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.fontSize(16).text(title, { underline: true });
  doc.moveDown();
  doc.fontSize(9).text(`Generado: ${new Date().toISOString()}`);
  doc.moveDown();

  rows.slice(0, 1000).forEach((row, index) => {
    doc.fontSize(10).text(`#${index + 1}`, { continued: false });
    columns.forEach((column) => {
      const value = typeof column.value === 'function' ? column.value(row) : row[column.value || column.key];
      doc.fontSize(8).text(`${column.header}: ${value ?? ''}`);
    });
    doc.moveDown(0.5);
  });

  if (rows.length > 1000) {
    doc.moveDown().fontSize(8).text(`Reporte truncado visualmente a 1000 filas de ${rows.length}. Use CSV para exportacion completa.`);
  }

  doc.end();
});

module.exports = { exportPdf };
