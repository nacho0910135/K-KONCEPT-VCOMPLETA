const { mailer } = require('../../utils/mailer');

const emailProvider = {
  async sendNotification(to, subject, body, metadata = {}) {
    if (!to?.email) {
      return { skipped: true, reason: 'Usuario sin email' };
    }

    return mailer.sendMail({
      to: to.email,
      subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ''),
      attachments: metadata.attachments,
      headers: metadata.headers
    });
  }
};

module.exports = { emailProvider };
