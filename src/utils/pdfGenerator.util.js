const PDFDocument = require('pdfkit');

const { buildReplacementCertificateTemplate } = require('../templates/replacementCertificate.template');

const formatDate = (date) => new Intl.DateTimeFormat('es-CR', {
  year: 'numeric',
  month: 'long',
  day: '2-digit'
}).format(new Date(date));

const addKeyValue = (doc, key, value) => {
  doc.font('Helvetica-Bold').text(`${key}: `, { continued: true });
  doc.font('Helvetica').text(String(value || 'No indicado'));
};

const addSection = (doc, title) => {
  doc.moveDown(1.2);
  doc.fontSize(13).font('Helvetica-Bold').text(title);
  doc.moveTo(72, doc.y + 4).lineTo(540, doc.y + 4).strokeColor('#D1D5DB').stroke();
  doc.moveDown(0.8);
  doc.strokeColor('#000000');
};

const generateReplacementCertificate = (data) => new Promise((resolve, reject) => {
  const template = buildReplacementCertificateTemplate(data);
  const doc = new PDFDocument({ size: 'LETTER', margin: 72 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(template.company.name, { align: 'center' });

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(template.company.subtitle, { align: 'center' })
    .text(`${template.company.email} | ${template.company.website}`, { align: 'center' });

  addSection(doc, 'Datos del ticket');
  addKeyValue(doc, 'Codigo', template.ticket.code);
  addKeyValue(doc, 'Titulo', template.ticket.title);

  addSection(doc, 'Datos del cliente');
  addKeyValue(doc, 'Nombre', template.client.name);
  addKeyValue(doc, 'Empresa', template.client.company);
  addKeyValue(doc, 'Email', template.client.email);
  addKeyValue(doc, 'Telefono', template.client.phone);

  addSection(doc, 'Producto defectuoso');
  addKeyValue(doc, 'Producto reportado', template.previousProduct.requestedProduct);
  addKeyValue(doc, 'Producto original asociado', template.previousProduct.originalProduct);

  addSection(doc, 'Producto nuevo entregado');
  addKeyValue(doc, 'Marca', template.replacementProduct.brand);
  addKeyValue(doc, 'Modelo', template.replacementProduct.model);
  addKeyValue(doc, 'Serial', template.replacementProduct.serialNumber);
  addKeyValue(doc, 'Notas', template.replacementProduct.notes);

  addSection(doc, 'Entrega');
  addKeyValue(doc, 'Fecha de entrega', formatDate(template.delivery.date));
  addKeyValue(doc, 'Tecnico responsable', template.delivery.technician);
  addKeyValue(doc, 'Observaciones', template.delivery.observations);

  doc.moveDown(4);
  doc.moveTo(160, doc.y).lineTo(450, doc.y).stroke();
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(10).text('Firma del cliente', { align: 'center' });

  doc.end();
});

module.exports = { generateReplacementCertificate };
