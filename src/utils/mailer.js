const nodemailer = require('nodemailer');

const { env } = require('../config/env');

const createTransporter = () => {
  if (!env.mail.host) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: env.mail.user
      ? {
          user: env.mail.user,
          pass: env.mail.pass
        }
      : undefined
  });
};

const transporter = createTransporter();

const mailer = {
  async sendMail(options) {
    if (!transporter) {
      return { skipped: true, reason: 'SMTP no configurado' };
    }

    return transporter.sendMail({
      from: env.mail.from,
      ...options
    });
  }
};

module.exports = { mailer };
