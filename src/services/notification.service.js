const { auditLogRepository } = require('../repositories/auditLog.repository');
const { notificationRepository } = require('../repositories/notification.repository');
const { notificationConfigRepository } = require('../repositories/notificationConfig.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { ForbiddenError, NotFoundError } = require('../utils/errors');
const { renderTemplate } = require('../utils/templateRenderer.util');
const { emailProvider } = require('./providers/email.provider');
const { inAppProvider } = require('./providers/inApp.provider');
const { pushProvider } = require('./providers/push.provider');
const { smsProvider } = require('./providers/sms.provider');
const { logger } = require('../utils/logger');

const CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'];

const providers = {
  IN_APP: inAppProvider,
  EMAIL: emailProvider,
  SMS: smsProvider,
  PUSH: pushProvider
};

const statusLabel = {
  OPEN: 'Abierto',
  PENDING: 'Pendiente de revision',
  IN_PROGRESS: 'En proceso',
  WAITING_CUSTOMER: 'Esperando respuesta del cliente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
  REOPENED: 'Reabierto'
};

const statusMeaning = {
  OPEN: 'recibimos tu solicitud y esta pendiente de asignacion o revision inicial',
  PENDING: 'tu caso ya esta en cola de atencion tecnica',
  IN_PROGRESS: 'nuestro tecnico ya esta trabajando en la revision del caso',
  WAITING_CUSTOMER: 'necesitamos una accion o respuesta tuya para poder continuar',
  RESOLVED: 'nuestro tecnico registro una solucion; puedes revisarla y confirmar si todo quedo correcto',
  CLOSED: 'el caso quedo finalizado',
  CANCELLED: 'el caso fue cancelado',
  REOPENED: 'el caso fue reabierto para una nueva revision'
};

const priorityLabel = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica'
};

const getRecipientName = (user = {}) => {
  const name = String(user.name || '').trim();
  if (name && !['cliente kollab', 'cliente'].includes(name.toLowerCase())) return name;
  return String(user.email || '').split('@')[0].replace(/[._-]+/g, ' ') || 'cliente';
};

const defaultCopy = {
  TICKET_CREATED: {
    subject: 'Ticket {{ticketCode}} creado',
    body: `
      <p>Hola {{userName}},</p>
      <p>Recibimos tu solicitud y abrimos el ticket <strong>{{ticketCode}}</strong>. Este es el resumen para seguimiento:</p>
      <ul>
        <li><strong>Titulo:</strong> {{ticketTitle}}</li>
        <li><strong>Categoria:</strong> {{categoryName}} / {{subcategoryName}}</li>
        <li><strong>Prioridad:</strong> {{priority}}</li>
        <li><strong>Estado:</strong> {{status}}</li>
      </ul>
      <p><strong>Descripcion enviada:</strong></p>
      <p>{{ticketDescription}}</p>
      <p>Lo revisaremos segun la prioridad indicada y te avisaremos cualquier cambio por este medio.</p>
      <p>Puedes dar seguimiento desde: <a href="{{ticketUrl}}">{{ticketUrl}}</a></p>
    `
  },
  TICKET_ASSIGNED: {
    subject: 'Ticket {{ticketCode}} asignado',
    body: `
      <p>Hola {{userName}},</p>
      <p>Asignamos el ticket <strong>{{ticketCode}}</strong> a nuestro tecnico <strong>{{technicianName}}</strong>.</p>
      <p>Esto significa que tu caso ya tiene un responsable tecnico y entra en revision.</p>
      <p><strong>Titulo:</strong> {{ticketTitle}}</p>
    `
  },
  STATUS_CHANGED: {
    subject: 'Ticket {{ticketCode}} cambio de estado',
    body: `
      <p>Hola {{userName}},</p>
      <p>Nuestro tecnico {{technicianName}} cambio el estado de tu ticket <strong>{{ticketCode}}</strong> a <strong>{{newStatus}}</strong>.</p>
      <p>Esto significa que {{newStatusMeaning}}.</p>
      <ul>
        <li><strong>Titulo:</strong> {{ticketTitle}}</li>
        <li><strong>Articulo:</strong> {{productName}}</li>
        <li><strong>Categoria:</strong> {{categoryName}} / {{subcategoryName}}</li>
        <li><strong>Estado anterior:</strong> {{previousStatus}}</li>
        <li><strong>Estado actual:</strong> {{newStatus}}</li>
      </ul>
      <p><strong>Comentario:</strong> {{comment}}</p>
    `
  },
  NEW_COMMENT: {
    subject: 'Nuevo comentario en {{ticketCode}}',
    body: 'Hola {{userName}}, {{commentAuthor}} agrego un comentario al ticket {{ticketCode}}: {{commentText}}'
  },
  TICKET_RESOLVED: {
    subject: 'Ticket {{ticketCode}} resuelto',
    body: `
      <p>Hola {{userName}},</p>
      <p>Nuestro tecnico {{technicianName}} marco como resuelto tu ticket <strong>{{ticketCode}}</strong>.</p>
      <p>Esto significa que se registro una solucion para tu caso. Por favor revisala y confirma si quedo correcto.</p>
      <ul>
        <li><strong>Titulo:</strong> {{ticketTitle}}</li>
        <li><strong>Articulo:</strong> {{productName}}</li>
        <li><strong>Categoria:</strong> {{categoryName}} / {{subcategoryName}}</li>
        <li><strong>Tipo de resolucion:</strong> {{closeType}}</li>
        <li><strong>Accion:</strong> {{resolutionAction}}</li>
        <li><strong>Monto de reembolso:</strong> {{refundAmount}}</li>
      </ul>
      <p><strong>Diagnostico:</strong> {{diagnosis}}</p>
      <p><strong>Solucion:</strong> {{solution}}</p>
      <p><strong>Comentario:</strong> {{comment}}</p>
    `
  },
  TICKET_CLOSED: {
    subject: 'Ticket {{ticketCode}} cerrado',
    body: 'Hola {{userName}}, el ticket {{ticketCode}} quedo cerrado. Gracias por confirmar la atencion recibida.'
  },
  TICKET_APPEALED: {
    subject: 'Apelacion abierta para {{ticketCode}}',
    body: `
      <p>Hola {{userName}},</p>
      <p>Has abierto una apelacion sobre el ticket <strong>{{ticketCode}}</strong>: <strong>{{ticketTitle}}</strong>.</p>
      <p><strong>Motivo enviado:</strong> {{appealReason}}</p>
      <p>Pronto recibiras una respuesta. Gracias por la preferencia.</p>
      <p>Puedes dar seguimiento desde: <a href="{{ticketUrl}}">{{ticketUrl}}</a></p>
    `
  },
  USER_ROLE_CHANGED: {
    subject: 'Tu rol en Kollab Koncepts ahora es {{newRole}}',
    body: `
      <p>Hola {{userName}},</p>
      <p>{{roleChangeMessage}}</p>
      <p>El administrador <strong>{{actorName}}</strong> actualizo tu acceso en la plataforma.</p>
      <ul>
        <li><strong>Rol anterior:</strong> {{previousRole}}</li>
        <li><strong>Rol nuevo:</strong> {{newRole}}</li>
      </ul>
      <p>Ya puedes iniciar sesion y usar las opciones disponibles para tu nuevo rol.</p>
    `
  },
  APPOINTMENT_RESCHEDULED: {
    subject: 'Cita reprogramada para {{ticketCode}}',
    body: 'Hola {{userName}}, la cita del ticket {{ticketCode}} fue reprogramada para {{appointmentDate}}.'
  },
  REPLACEMENT_APPROVED: {
    subject: 'Reemplazo aprobado para {{ticketCode}}',
    body: `
      <p>Hola {{userName}},</p>
      <p>Te informamos que para el ticket <strong>{{ticketCode}}</strong> se tomo la decision de aplicar un reemplazo.</p>
      <ul>
        <li><strong>Ticket:</strong> {{ticketCode}} - {{ticketTitle}}</li>
        <li><strong>Tecnico responsable:</strong> {{technicianName}}</li>
        <li><strong>Articulo reportado:</strong> {{productName}}</li>
        <li><strong>Articulo de reemplazo:</strong> {{replacementProduct}}</li>
        <li><strong>Marca / modelo:</strong> {{replacementBrand}} {{replacementModel}}</li>
        <li><strong>Serie:</strong> {{replacementSerialNumber}}</li>
      </ul>
      <p>{{replacementNotes}}</p>
      <p>Te avisaremos cualquier avance hasta completar la entrega.</p>
    `
  },
  REFUND_REGISTERED: {
    subject: 'Reembolso registrado para {{ticketCode}}',
    body: `
      <p>Hola {{userName}},</p>
      <p>Te informamos que para el ticket <strong>{{ticketCode}}</strong> se aplicara un reembolso.</p>
      <ul>
        <li><strong>Ticket:</strong> {{ticketCode}} - {{ticketTitle}}</li>
        <li><strong>Tecnico responsable:</strong> {{technicianName}}</li>
        <li><strong>Articulo:</strong> {{productName}}</li>
        <li><strong>Tipo de reembolso:</strong> {{resolutionAction}}</li>
        <li><strong>Monto a reembolsar:</strong> {{refundAmount}}</li>
      </ul>
      <p><strong>Detalle:</strong> {{solution}}</p>
      <p>Adjuntamos la constancia de reembolso cuando aplique por correo.</p>
    `
  },
  SLA_BREACH: {
    subject: 'SLA vencido en {{ticketCode}}',
    body: 'Hola {{userName}}, el ticket {{ticketCode}} excedio su fecha limite de atencion {{deadlineAt}}. Nuestro equipo debe priorizar el seguimiento.'
  }
};

const defaultInAppCopy = {
  TICKET_CREATED: {
    subject: 'Ticket {{ticketCode}} creado',
    body: 'Hola {{userName}}, recibimos tu ticket {{ticketCode}}. Prioridad: {{priority}}. Estado: {{status}}.'
  },
  TICKET_ASSIGNED: defaultCopy.TICKET_ASSIGNED,
  STATUS_CHANGED: defaultCopy.STATUS_CHANGED,
  NEW_COMMENT: defaultCopy.NEW_COMMENT,
  TICKET_RESOLVED: defaultCopy.TICKET_RESOLVED,
  TICKET_CLOSED: defaultCopy.TICKET_CLOSED,
  TICKET_APPEALED: defaultCopy.TICKET_APPEALED,
  USER_ROLE_CHANGED: defaultCopy.USER_ROLE_CHANGED,
  APPOINTMENT_RESCHEDULED: defaultCopy.APPOINTMENT_RESCHEDULED,
  REPLACEMENT_APPROVED: defaultCopy.REPLACEMENT_APPROVED,
  REFUND_REGISTERED: defaultCopy.REFUND_REGISTERED,
  SLA_BREACH: defaultCopy.SLA_BREACH
};

const uniqueById = (users) => Array.from(
  users.filter(Boolean).reduce((acc, user) => acc.set(user.id, user), new Map()).values()
);

const normalizePayload = (payload, user) => ({
  userName: getRecipientName(user),
  ...payload,
  status: statusLabel[payload.status] || payload.status || '',
  priority: priorityLabel[payload.priority] || payload.priority || '',
  previousStatus: statusLabel[payload.previousStatus] || payload.previousStatus || '',
  newStatus: statusLabel[payload.newStatus] || payload.newStatus || '',
  newStatusMeaning: payload.newStatusMeaning || statusMeaning[payload.newStatus] || 'tenemos una actualizacion sobre el avance de tu caso'
});

const stripHtml = (value = '') => String(value)
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<\/(p|li|ul|ol|div|br)>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const decodeTemplateHtml = (value = '') => String(value)
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');

const isLegacyTemplate = (value = '') => [
  'fue asignado a {{technicianName}}',
  'cambio de {{previousStatus}} a {{newStatus}}',
  'fue marcado como resuelto',
  'fue abierto correctamente. Prioridad',
  'el reemplazo solicitado para el ticket {{ticketCode}} fue aprobado'
].some((snippet) => String(value).includes(snippet));

const getEnabledChannels = async () => {
  const configured = await notificationConfigRepository.listChannels();
  const enabled = new Set(configured.filter((channel) => channel.enabled).map((channel) => channel.channel));
  enabled.add('IN_APP');
  return CHANNELS.filter((channel) => enabled.has(channel));
};

const renderForChannel = async ({ event, channel, payload }) => {
  const template = await notificationConfigRepository.findActiveTemplate({ event, channel });
  const fallbackCopies = channel === 'IN_APP' ? defaultInAppCopy : defaultCopy;
  const fallback = fallbackCopies[event] || { subject: event, body: payload.message || event };
  const activeTemplate = isLegacyTemplate(template?.bodyTemplate) ? null : template;
  const escape = channel === 'EMAIL';
  const subjectTemplate = activeTemplate?.subject || fallback.subject;
  const bodyTemplate = channel === 'EMAIL'
    ? decodeTemplateHtml(activeTemplate?.bodyTemplate || fallback.body)
    : activeTemplate?.bodyTemplate || fallback.body;

  const rendered = {
    subject: renderTemplate(subjectTemplate, payload, { escape }),
    body: renderTemplate(bodyTemplate, payload, { escape })
  };

  return channel === 'IN_APP'
    ? { ...rendered, body: stripHtml(rendered.body) }
    : rendered;
};

const recordFrequencyBlock = ({ userId, event, entityType, entityId, channel, rule, counts }) => (
  auditLogRepository.create({
    userId,
    action: 'NOTIFICATION_BLOCKED_BY_FREQUENCY',
    entity: entityType,
    entityId,
    result: 'SUCCESS',
    details: {
      event,
      channel,
      ruleId: rule.id,
      maxPerUserPerHour: rule.maxPerUserPerHour,
      maxPerUserPerDay: rule.maxPerUserPerDay,
      sentLastHour: counts.hour,
      sentLastDay: counts.day
    }
  })
);

const isBlockedByFrequency = async ({ userId, event, entityType, entityId, channel }) => {
  const rule = await notificationConfigRepository.findFrequencyRule(event);
  if (!rule) return false;

  const now = Date.now();
  const [hour, day] = await Promise.all([
    notificationRepository.countSentSince({
      userId,
      event,
      since: new Date(now - 60 * 60 * 1000)
    }),
    notificationRepository.countSentSince({
      userId,
      event,
      since: new Date(now - 24 * 60 * 60 * 1000)
    })
  ]);

  const blocked = hour >= rule.maxPerUserPerHour || day >= rule.maxPerUserPerDay;
  if (blocked) {
    await recordFrequencyBlock({
      userId,
      event,
      entityType,
      entityId,
      channel,
      rule,
      counts: { hour, day }
    });
  }

  return blocked;
};

const persistExternalNotification = ({ userId, event, entityType, entityId, channel, subject, body }) => (
  notificationRepository.create({
    userId,
    event,
    title: subject || event,
    message: body,
    entityType,
    entityId,
    channel,
    sentAt: new Date()
  })
);

const dispatchNow = async ({ userId, event, entityType, entityId, payload = {}, skipChannels = [] }) => {
  const user = await notificationConfigRepository.findUserById(userId);
  if (!user || !user.active) return { sent: 0, skipped: 0 };

  const renderedPayload = normalizePayload(payload, user);
  const skip = new Set(skipChannels);
  const channels = (await getEnabledChannels()).filter((channel) => !skip.has(channel));
  let sent = 0;
  let skipped = 0;

  for (const channel of channels) {
    try {
      if (await isBlockedByFrequency({ userId, event, entityType, entityId, channel })) {
        skipped += 1;
        continue;
      }

      const { subject, body } = await renderForChannel({ event, channel, payload: renderedPayload });
      const provider = providers[channel];
      const result = await provider.sendNotification(user, subject, body, {
        event,
        entityType,
        entityId,
        channel,
        payload: renderedPayload
      });

      if (result?.skipped) {
        skipped += 1;
        await auditLogRepository.create({
          userId,
          action: 'NOTIFICATION_CHANNEL_SKIPPED',
          entity: entityType,
          entityId,
          result: 'SUCCESS',
          details: {
            event,
            channel,
            reason: result.reason
          }
        });
        continue;
      }

      if (!result?.persisted) {
        await persistExternalNotification({ userId, event, entityType, entityId, channel, subject, body });
      }

      sent += 1;
    } catch (error) {
      skipped += 1;
      logger.error({ error, userId, event, channel }, 'Error enviando notificacion');
      await auditLogRepository.create({
        userId,
        action: 'NOTIFICATION_CHANNEL_FAILED',
        entity: entityType,
        entityId,
        result: 'FAILURE',
        details: {
          event,
          channel,
          message: error.message
        }
      });
    }
  }

  return { sent, skipped };
};

const queueDispatch = (job) => {
  setImmediate(() => {
    dispatchNow(job).catch((error) => {
      logger.error({ error, job }, 'Error en dispatchNotification en background');
    });
  });
};

const notificationService = {
  dispatchNotification(job) {
    queueDispatch(job);
    return Promise.resolve({ queued: true });
  },

  dispatchNotificationNow: dispatchNow,

  async notifyUsers({ event, title, message, recipients, entityType, entityId, payload = {} }) {
    const users = uniqueById(recipients);

    await Promise.all(users.map((user) => this.dispatchNotification({
      userId: user.id,
      event,
      entityType,
      entityId,
      payload: {
        title,
        message,
        ...payload
      }
    })));

    return { count: users.length };
  },

  async notifySlaBreach(ticket, recipients) {
    return this.notifyUsers({
      event: 'SLA_BREACH',
      title: 'SLA vencido',
      message: `El ticket "${ticket.title}" excedio su fecha limite de SLA.`,
      recipients,
      entityType: 'Ticket',
      entityId: ticket.id,
      payload: {
        ticketCode: ticket.code,
        ticketTitle: ticket.title,
        deadlineAt: ticket.slaDeadline
      }
    });
  },

  async listMine(query, user) {
    const pagination = buildPagination(query);
    const where = {
      channel: 'IN_APP',
      ...(query.read !== undefined ? { read: query.read } : {})
    };

    const [total, items] = await notificationRepository.listForUser({
      userId: user.id,
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async listTicketEmails(ticketId, user) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');
    const allowed = user.role === 'ADMIN' || ticket.clientId === user.id || ticket.assignedTechnicianId === user.id;
    if (!allowed) throw new ForbiddenError('No tiene acceso a este ticket');
    return notificationRepository.listTicketEmails(ticketId, ticket.clientId);
  },

  async markRead(id, user) {
    const notification = await notificationRepository.findUserNotification({ id, userId: user.id });
    if (!notification) throw new NotFoundError('Notificacion no encontrada');
    return notificationRepository.markRead({ id, userId: user.id });
  },

  markAllRead(user) {
    return notificationRepository.markAllRead(user.id);
  },

  clearMine(user) {
    return notificationRepository.deleteForUser(user.id);
  },

  async unreadCount(user) {
    return { count: await notificationRepository.countUnread(user.id, { channel: 'IN_APP' }) };
  }
};

module.exports = { notificationService, CHANNELS };
