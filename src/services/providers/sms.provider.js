const smsProvider = {
  async sendNotification(to, _subject, body) {
    if (!to?.phone) {
      return { skipped: true, reason: 'Usuario sin telefono' };
    }

    return {
      skipped: true,
      reason: 'Proveedor SMS no configurado',
      preview: body
    };
  }
};

module.exports = { smsProvider };
