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
      response: info.response,
      provider: info.provider
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
  },

  async sendPasswordResetCodeEmail(user, code, expiresInMinutes) {
    const resetUrl = `${env.appUrl.replace(/\/$/, '')}/forgot-password`;

    return sendSafely({
      to: user.email,
      subject: 'Codigo para restablecer tu contrasena',
      html: layout({
        title: 'Restablecer contrasena',
        preview: 'Usa este codigo para crear una nueva contrasena.',
        body: `
          <p>Hola ${escapeHtml(user.name)},</p>
          <p>Recibimos una solicitud para restablecer tu contrasena.</p>
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 24px 0;">${escapeHtml(code)}</p>
          <p>Este codigo vence en ${expiresInMinutes} minutos.</p>
          <p><a href="${escapeHtml(resetUrl)}" style="color: #2563eb;">Restablecer contrasena</a></p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        `
      }),
      text: [
        `Hola ${user.name},`,
        '',
        'Recibimos una solicitud para restablecer tu contrasena.',
        `Codigo: ${code}`,
        `Este codigo vence en ${expiresInMinutes} minutos.`,
        `Restablecer contrasena: ${resetUrl}`,
        '',
        'Si no solicitaste este cambio, puedes ignorar este correo.'
      ].join('\n')
    }, { type: 'PASSWORD_RESET_CODE_EMAIL', userId: user.id });
  },

  async sendTicketCreatedEmail(user, ticket) {
    const ticketUrl = `${env.appUrl.replace(/\/$/, '')}/client/tickets/${ticket.id}`;

    return sendSafely({
      to: user.email,
      subject: `Confirmacion de ticket ${ticket.code}`,
      html: layout({
        title: `Ticket ${ticket.code} creado`,
        preview: 'Recibimos tu solicitud correctamente.',
        body: `
          <p>Hola ${escapeHtml(user.name)},</p>
          <p>Recibimos tu solicitud correctamente y ya quedo registrada para seguimiento.</p>
          <p><strong>Titulo:</strong> ${escapeHtml(ticket.title)}</p>
          <p><strong>Prioridad:</strong> ${escapeHtml(ticket.priority)}</p>
          <p><strong>Estado:</strong> ${escapeHtml(ticket.status)}</p>
          <p><a href="${escapeHtml(ticketUrl)}" style="color: #2563eb;">Ver ticket</a></p>
        `
      }),
      text: [
        `Hola ${user.name},`,
        '',
        `Recibimos tu solicitud ${ticket.code} correctamente.`,
        `Titulo: ${ticket.title}`,
        `Prioridad: ${ticket.priority}`,
        `Estado: ${ticket.status}`,
        `Ver ticket: ${ticketUrl}`
      ].join('\n')
    }, { type: 'TICKET_CREATED_EMAIL', userId: user.id, ticketId: ticket.id });
  },

  async sendTicketStatusEmail(user, ticket, update) {
    const ticketUrl = `${env.appUrl.replace(/\/$/, '')}/client/tickets/${ticket.id}`;
    const resolutionRows = update.newStatus === 'Resuelto' ? `
          <p><strong>Tipo de resolucion:</strong> ${escapeHtml(update.closeType || 'No indicado')}</p>
          <p><strong>Accion:</strong> ${escapeHtml(update.resolutionAction || 'No indicada')}</p>
          ${update.refundAmount ? `<p><strong>Monto de reembolso:</strong> ${escapeHtml(update.refundAmount)}</p>` : ''}
          ${update.diagnosis ? `<p><strong>Diagnostico:</strong> ${escapeHtml(update.diagnosis)}</p>` : ''}
          ${update.solution ? `<p><strong>Solucion:</strong> ${escapeHtml(update.solution)}</p>` : ''}
        ` : '';
    const resolutionText = update.newStatus === 'Resuelto'
      ? [
          `Tipo de resolucion: ${update.closeType || 'No indicado'}`,
          `Accion: ${update.resolutionAction || 'No indicada'}`,
          update.refundAmount ? `Monto de reembolso: ${update.refundAmount}` : '',
          update.diagnosis ? `Diagnostico: ${update.diagnosis}` : '',
          update.solution ? `Solucion: ${update.solution}` : ''
        ].filter(Boolean)
      : [];

    return sendSafely({
      to: user.email,
      subject: `Actualizacion del ticket ${ticket.code}`,
      html: layout({
        title: `Actualizacion del ticket ${ticket.code}`,
        preview: `El estado cambio a ${update.newStatus}.`,
        body: `
          <p>Hola ${escapeHtml(user.name)},</p>
          <p>${escapeHtml(update.technicianName || 'El tecnico asignado')} actualizo tu caso.</p>
          <p><strong>Ticket:</strong> ${escapeHtml(ticket.code)}</p>
          <p><strong>Titulo:</strong> ${escapeHtml(ticket.title)}</p>
          <p><strong>Producto:</strong> ${escapeHtml(update.productName || ticket.product?.name || 'Sin producto asociado')}</p>
          <p><strong>Estado anterior:</strong> ${escapeHtml(update.previousStatus || 'Nuevo')}</p>
          <p><strong>Estado actual:</strong> ${escapeHtml(update.newStatus)}</p>
          ${resolutionRows}
          ${update.comment ? `<p><strong>Comentario:</strong> ${escapeHtml(update.comment)}</p>` : ''}
          <p><a href="${escapeHtml(ticketUrl)}" style="color: #2563eb;">Ver ticket</a></p>
        `
      }),
      text: [
        `Hola ${user.name},`,
        '',
        `${update.technicianName || 'El tecnico asignado'} actualizo tu caso ${ticket.code}.`,
        `Titulo: ${ticket.title}`,
        `Producto: ${update.productName || ticket.product?.name || 'Sin producto asociado'}`,
        `Estado anterior: ${update.previousStatus || 'Nuevo'}`,
        `Estado actual: ${update.newStatus}`,
        ...resolutionText,
        update.comment ? `Comentario: ${update.comment}` : '',
        `Ver ticket: ${ticketUrl}`
      ].filter(Boolean).join('\n')
    }, { type: 'TICKET_STATUS_EMAIL', userId: user.id, ticketId: ticket.id });
  },

  async sendTicketAssignedEmail(user, ticket, technician) {
    const ticketUrl = `${env.appUrl.replace(/\/$/, '')}/client/tickets/${ticket.id}`;

    return sendSafely({
      to: user.email,
      subject: `Tecnico asignado al ticket ${ticket.code}`,
      html: layout({
        title: `Tecnico asignado al ticket ${ticket.code}`,
        preview: `${technician.name} fue asignado a tu caso.`,
        body: `
          <p>Hola ${escapeHtml(user.name)},</p>
          <p>Ya asignamos un tecnico a tu caso.</p>
          <p><strong>Ticket:</strong> ${escapeHtml(ticket.code)}</p>
          <p><strong>Titulo:</strong> ${escapeHtml(ticket.title)}</p>
          <p><strong>Tecnico:</strong> ${escapeHtml(technician.name)}</p>
          <p><a href="${escapeHtml(ticketUrl)}" style="color: #2563eb;">Ver ticket</a></p>
        `
      }),
      text: [
        `Hola ${user.name},`,
        '',
        `Ya asignamos un tecnico a tu caso ${ticket.code}.`,
        `Titulo: ${ticket.title}`,
        `Tecnico: ${technician.name}`,
        `Ver ticket: ${ticketUrl}`
      ].join('\n')
    }, { type: 'TICKET_ASSIGNED_EMAIL', userId: user.id, ticketId: ticket.id });
  },

  async sendTicketCommentEmail(user, ticket, comment) {
    const ticketUrl = `${env.appUrl.replace(/\/$/, '')}/client/tickets/${ticket.id}`;

    return sendSafely({
      to: user.email,
      subject: `Nuevo comentario en ${ticket.code}`,
      html: layout({
        title: `Nuevo comentario en ${ticket.code}`,
        preview: `${comment.authorName} agrego un comentario.`,
        body: `
          <p>Hola ${escapeHtml(user.name)},</p>
          <p>${escapeHtml(comment.authorName)} agrego un comentario en tu caso.</p>
          <p><strong>Comentario:</strong> ${escapeHtml(comment.text)}</p>
          <p><a href="${escapeHtml(ticketUrl)}" style="color: #2563eb;">Ver ticket</a></p>
        `
      }),
      text: [
        `Hola ${user.name},`,
        '',
        `${comment.authorName} agrego un comentario en tu caso ${ticket.code}.`,
        `Comentario: ${comment.text}`,
        `Ver ticket: ${ticketUrl}`
      ].join('\n')
    }, { type: 'TICKET_COMMENT_EMAIL', userId: user.id, ticketId: ticket.id });
  },

  async sendReturnItemRequestEmail(user, ticket, technician) {
    const ticketUrl = `${env.appUrl.replace(/\/$/, '')}/client/tickets/${ticket.id}`;

    return sendSafely({
      to: user.email,
      subject: `Devolucion requerida para el ticket ${ticket.code}`,
      html: layout({
        title: `Devolucion requerida para ${ticket.code}`,
        preview: 'Para continuar con tu caso debes devolver el articulo a la tienda.',
        body: `
          <p>Hola ${escapeHtml(user.name)},</p>
          <p>${escapeHtml(technician.name)} solicita que devuelvas el articulo a la tienda para poder continuar con el caso.</p>
          <p><strong>Ticket:</strong> ${escapeHtml(ticket.code)}</p>
          <p><strong>Titulo:</strong> ${escapeHtml(ticket.title)}</p>
          <p>Por favor lleva el articulo a la tienda de Kollab Koncepts e indica el codigo del ticket.</p>
          <p><a href="${escapeHtml(ticketUrl)}" style="color: #2563eb;">Ver ticket</a></p>
        `
      }),
      text: [
        `Hola ${user.name},`,
        '',
        `${technician.name} solicita que devuelvas el articulo a la tienda para poder continuar con el caso.`,
        `Ticket: ${ticket.code}`,
        `Titulo: ${ticket.title}`,
        'Por favor lleva el articulo a la tienda de Kollab Koncepts e indica el codigo del ticket.',
        `Ver ticket: ${ticketUrl}`
      ].join('\n')
    }, { type: 'RETURN_ITEM_REQUEST_EMAIL', userId: user.id, ticketId: ticket.id });
  }
};

module.exports = { transactionalEmailService };
