const buildReplacementCertificateTemplate = (data) => ({
  company: {
    name: 'Kollab Koncepts',
    subtitle: 'Constancia formal de reemplazo de producto',
    email: 'soporte@kollabkoncepts.com',
    website: 'www.kollabkoncepts.com'
  },
  ticket: {
    code: data.ticket.code,
    title: data.ticket.title
  },
  client: {
    name: data.ticket.client.name,
    company: data.ticket.client.company || 'No indicado',
    email: data.ticket.client.email,
    phone: data.ticket.client.phone || 'No indicado'
  },
  previousProduct: {
    requestedProduct: data.requestedProduct,
    originalProduct: data.ticket.product
      ? `${data.ticket.product.brand || ''} ${data.ticket.product.model || ''} / Serie ${data.ticket.product.serialNumber}`.trim()
      : 'No asociado'
  },
  replacementProduct: {
    brand: data.replacementBrand || data.replacementProduct?.brand || 'No indicado',
    model: data.replacementModel || data.replacementProduct?.model || 'No indicado',
    serialNumber: data.replacementSerialNumber || data.replacementProduct?.serialNumber || 'No indicado',
    notes: data.replacementNotes || 'Sin notas adicionales'
  },
  delivery: {
    date: data.deliveryDate,
    observations: data.deliveryObservations || 'Sin observaciones',
    technician: data.deliveredBy?.name || 'No indicado'
  }
});

module.exports = { buildReplacementCertificateTemplate };
