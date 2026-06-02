const { env } = require('../config/env');
const { mailer } = require('../utils/mailer');
const { escapeHtml } = require('../utils/templateRenderer.util');
const { logger } = require('../utils/logger');

const layout = ({ title, preview, body }) => `
  <div style="font-family: Arial, sans-serif; color: #171717; line-height: 1.5; max-width: 640px; margin: 0 auto;">
    <p style="display:none; overflow:hidden; max-height:0;">${escapeHtml(preview || title)}</p>
    <div style="border-bottom: 1px solid #e5e5e5; padding: 20px 0;">
      <h1 style="font-size: 22px; margin: 0;">${escapeHtml(title)}</h1>
    </div>
    <div style="padding: 24px 0;">
      ${body}
    </div>
    <div style="border-top: 1px solid #e5e5e5; color: #737373; font-size: 12px; padding: 16px 0;">
      Kollab Koncepts
    </div>
  </div>
`;

const sendSafely = async (options, context) => {
  try {
    const info = await mailer.sendMail(options);
    logger.info({
      context,
      accepted: info.accepted,
      rejected: info.rejected,
      messageId: info.messageId,
      response: info.response
    }, 'Correo transaccional enviado');
    return info;
  } catch (error) {
    logger.error({ error, context }, 'Error enviando correo transaccional');
    throw error;
  }
};

const transactionalEmailService = {
  async sendWelcomeEmail(user) {
    const loginUrl = `${env.appUrl.replace(/\/$/, '')}/login`;

    return sendSafely({
      to: user.email,
      subject: 'Bienvenido a Kollab Koncepts',
      html: layout({
        title: 'Bienvenido a Kollab Koncepts',
        preview: 'Tu cuenta de cliente fue creada correctamente.',
        body: `
          <p>Hola ${escapeHtml(user.name)},</p>
          <p>Tu cuenta de cliente fue creada correctamente. Desde ahora puedes abrir tickets, consultar el estado de tus solicitudes y revisar tus notificaciones.</p>
          <p><strong>Correo de acceso:</strong> ${escapeHtml(user.email)}</p>
          <p><a href="${escapeHtml(loginUrl)}" style="color: #2563eb;">Ingresar al sistema</a></p>
        `
      }),
      text: [
        `Hola ${user.name},`,
        '',
        'Tu cuenta de cliente fue creada correctamente.',
        `Correo de acceso: ${user.email}`,
        `Ingresar al sistema: ${loginUrl}`
      ].join('\n')
    }, { type: 'WELCOME_EMAIL', userId: user.id });
  }
};

module.exports = { transactionalEmailService };
