const pushProvider = {
  async sendNotification(_to, subject, body) {
    return {
      skipped: true,
      reason: 'Proveedor PUSH no configurado',
      preview: { subject, body }
    };
  }
};

module.exports = { pushProvider };
