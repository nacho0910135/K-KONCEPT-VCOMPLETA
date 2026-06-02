const { auditLogRepository } = require('../repositories/auditLog.repository');
const { notificationRepository } = require('../repositories/notification.repository');
const { notificationConfigRepository } = require('../repositories/notificationConfig.repository');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { NotFoundError } = require('../utils/errors');
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

const defaultCopy = {
  TICKET_CREATED: {
    subject: 'Ticket {{ticketCode}} creado',
    body: `
      <p>Hola {{userName}},</p>
      <p>Tu ticket fue abierto correctamente. Este es el resumen para seguimiento:</p>
      <ul>
        <li><strong>ID del ticket:</strong> {{ticketCode}}</li>
        <li><strong>Titulo:</strong> {{ticketTitle}}</li>
        <li><strong>Categoria:</strong> {{categoryName}} / {{subcategoryName}}</li>
        <li><strong>Prioridad:</strong> {{priority}}</li>
        <li><strong>Estado:</strong> {{status}}</li>
      </ul>
      <p><strong>Descripcion enviada:</strong></p>
      <p>{{ticketDescription}}</p>
      <p>Puedes dar seguimiento desde: <a href="{{ticketUrl}}">{{ticketUrl}}</a></p>
    `
  },
  TICKET_ASSIGNED: {
    subject: 'Ticket {{ticketCode}} asignado',
    body: 'El ticket {{ticketCode}} fue asignado a {{technicianName}}.'
  },
  STATUS_CHANGED: {
    subject: 'Ticket {{ticketCode}} cambio de estado',
    body: 'El ticket {{ticketCode}} cambio a {{newStatus}}.'
  },
  NEW_COMMENT: {
    subject: 'Nuevo comentario en {{ticketCode}}',
    body: '{{commentAuthor}} agrego un comentario al ticket {{ticketCode}}: {{commentText}}'
  },
  TICKET_RESOLVED: {
    subject: 'Ticket {{ticketCode}} resuelto',
    body: 'El ticket {{ticketCode}} fue marcado como resuelto.'
  },
  TICKET_CLOSED: {
    subject: 'Ticket {{ticketCode}} cerrado',
    body: 'El ticket {{ticketCode}} fue cerrado.'
  },
  APPOINTMENT_RESCHEDULED: {
    subject: 'Cita reprogramada para {{ticketCode}}',
    body: 'La cita del ticket {{ticketCode}} fue reprogramada para {{appointmentDate}}.'
  },
  REPLACEMENT_APPROVED: {
    subject: 'Reemplazo aprobado para {{ticketCode}}',
    body: 'El reemplazo solicitado para el ticket {{ticketCode}} fue aprobado.'
  },
  SLA_BREACH: {
    subject: 'SLA vencido en {{ticketCode}}',
    body: 'El ticket {{ticketCode}} excedio su fecha limite de SLA {{deadlineAt}}.'
  }
};

const defaultInAppCopy = {
  TICKET_CREATED: {
    subject: 'Ticket {{ticketCode}} creado',
    body: 'Tu ticket {{ticketCode}} fue abierto correctamente. Prioridad: {{priority}}. Estado: {{status}}.'
  },
  TICKET_ASSIGNED: defaultCopy.TICKET_ASSIGNED,
  STATUS_CHANGED: defaultCopy.STATUS_CHANGED,
  NEW_COMMENT: defaultCopy.NEW_COMMENT,
  TICKET_RESOLVED: defaultCopy.TICKET_RESOLVED,
  TICKET_CLOSED: defaultCopy.TICKET_CLOSED,
  APPOINTMENT_RESCHEDULED: defaultCopy.APPOINTMENT_RESCHEDULED,
  REPLACEMENT_APPROVED: defaultCopy.REPLACEMENT_APPROVED,
  SLA_BREACH: defaultCopy.SLA_BREACH
};

const uniqueById = (users) => Array.from(
  users.filter(Boolean).reduce((acc, user) => acc.set(user.id, user), new Map()).values()
);

const normalizePayload = (payload, user) => ({
  userName: user?.name || '',
  ...payload
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
  const escape = channel === 'EMAIL';
  const subjectTemplate = template?.subject || fallback.subject;
  const bodyTemplate = template?.bodyTemplate || fallback.body;

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

const dispatchNow = async ({ userId, event, entityType, entityId, payload = {} }) => {
  const user = await notificationConfigRepository.findUserById(userId);
  if (!user || !user.active) return { sent: 0, skipped: 0 };

  const renderedPayload = normalizePayload(payload, user);
  const channels = await getEnabledChannels();
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

  async markRead(id, user) {
    const notification = await notificationRepository.findUserNotification({ id, userId: user.id });
    if (!notification) throw new NotFoundError('Notificacion no encontrada');
    return notificationRepository.markRead({ id, userId: user.id });
  },

  markAllRead(user) {
    return notificationRepository.markAllRead(user.id);
  },

  async unreadCount(user) {
    return { count: await notificationRepository.countUnread(user.id, { channel: 'IN_APP' }) };
  }
};

module.exports = { notificationService, CHANNELS };
