const { notificationConfigRepository } = require('../repositories/notificationConfig.repository');
const { auditService } = require('./audit.service');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const SECRET_KEY_PATTERN = /(secret|password|pass|token|api[_-]?key|credential)/i;
const SECRET_REF_PATTERN = /^(env|secret|vault|sm):[A-Za-z0-9_.:/-]+$/;

const assertNoPlainTextSecrets = (config = {}) => {
  for (const [key, value] of Object.entries(config || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      assertNoPlainTextSecrets(value);
      continue;
    }

    if (SECRET_KEY_PATTERN.test(key) && typeof value === 'string' && !SECRET_REF_PATTERN.test(value)) {
      throw new BadRequestError(`La credencial ${key} debe guardarse como referencia segura env:, secret:, vault: o sm:`);
    }
  }
};

const redactConfig = (config = {}) => Object.fromEntries(Object.entries(config || {}).map(([key, value]) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return [key, redactConfig(value)];
  }

  return SECRET_KEY_PATTERN.test(key) ? [key, value ? '[REDACTED]' : value] : [key, value];
}));

const sanitizeChannel = (channel) => ({
  ...channel,
  config: redactConfig(channel.config)
});

const ensureTemplateExists = async (id) => {
  const template = await notificationConfigRepository.findTemplateById(id);
  if (!template) throw new NotFoundError('Plantilla de notificacion no encontrada');
  return template;
};

const ensureFrequencyRuleExists = async (id) => {
  const rule = await notificationConfigRepository.findFrequencyRuleById(id);
  if (!rule) throw new NotFoundError('Regla de frecuencia no encontrada');
  return rule;
};

const notificationConfigService = {
  async createTemplate(payload, user, context = {}) {
    const template = await notificationConfigRepository.createTemplate(payload);

    await auditService.record({
      userId: user?.id || null,
      action: 'NOTIFICATION_TEMPLATE_UPDATED',
      entity: 'NotificationTemplate',
      entityId: template.id,
      newValue: template,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return template;
  },

  listTemplates(query) {
    return notificationConfigRepository.listTemplates({
      ...(query.event ? { event: query.event } : {}),
      ...(query.channel ? { channel: query.channel } : {})
    });
  },

  async updateTemplate(id, payload, user, context = {}) {
    const current = await ensureTemplateExists(id);
    const next = { ...current, ...payload };

    if (!next.bodyTemplate?.trim()) {
      throw new BadRequestError('bodyTemplate no puede estar vacio');
    }

    if (next.channel === 'EMAIL' && !next.subject?.trim()) {
      throw new BadRequestError('subject es requerido para plantillas EMAIL');
    }

    const updated = await notificationConfigRepository.updateTemplate(id, payload);

    await auditService.record({
      userId: user?.id || null,
      action: 'NOTIFICATION_TEMPLATE_UPDATED',
      entity: 'NotificationTemplate',
      entityId: id,
      previousValue: current,
      newValue: updated,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return updated;
  },

  async toggleTemplate(id, user, context = {}) {
    const template = await ensureTemplateExists(id);
    const updated = await notificationConfigRepository.updateTemplate(id, { active: !template.active });

    await auditService.record({
      userId: user?.id || null,
      action: 'NOTIFICATION_TEMPLATE_UPDATED',
      entity: 'NotificationTemplate',
      entityId: id,
      previousValue: { active: template.active },
      newValue: { active: updated.active },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return updated;
  },

  async listChannels() {
    const existing = await notificationConfigRepository.listChannels();
    const existingNames = new Set(existing.map((channel) => channel.channel));

    for (const channel of ['IN_APP', 'EMAIL', 'SMS', 'PUSH']) {
      if (!existingNames.has(channel)) {
        await notificationConfigRepository.upsertChannel({
          channel,
          enabled: channel === 'IN_APP',
          config: {}
        });
      }
    }

    const channels = await notificationConfigRepository.listChannels();
    return channels.map(sanitizeChannel);
  },

  async updateChannel(channel, payload, user, context = {}) {
    if (!['IN_APP', 'EMAIL', 'SMS', 'PUSH'].includes(channel)) {
      throw new BadRequestError('Canal de notificacion no soportado');
    }

    if (channel === 'IN_APP' && payload.enabled === false) {
      throw new BadRequestError('El canal IN_APP siempre debe permanecer activo');
    }

    if (payload.config) assertNoPlainTextSecrets(payload.config);

    const updated = await notificationConfigRepository.upsertChannel({
      channel,
      enabled: channel === 'IN_APP' ? true : payload.enabled,
      config: payload.config
    });

    await auditService.record({
      userId: user.id,
      action: 'NOTIFICATION_CHANNEL_TOGGLED',
      entity: 'NotificationChannelsConfig',
      entityId: updated.id,
      newValue: {
        channel: updated.channel,
        enabled: updated.enabled,
        config: redactConfig(updated.config)
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return sanitizeChannel(updated);
  },

  async createFrequencyRule(payload, user, context = {}) {
    const rule = await notificationConfigRepository.createFrequencyRule(payload);

    await auditService.record({
      userId: user?.id || null,
      action: 'NOTIFICATION_FREQUENCY_RULE_UPDATED',
      entity: 'NotificationFrequencyRule',
      entityId: rule.id,
      newValue: rule,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return rule;
  },

  listFrequencyRules() {
    return notificationConfigRepository.listFrequencyRules();
  },

  async updateFrequencyRule(id, payload, user, context = {}) {
    const current = await ensureFrequencyRuleExists(id);
    const next = { ...current, ...payload };

    if (next.maxPerUserPerDay < next.maxPerUserPerHour) {
      throw new BadRequestError('maxPerUserPerDay debe ser mayor o igual a maxPerUserPerHour');
    }

    const updated = await notificationConfigRepository.updateFrequencyRule(id, payload);

    await auditService.record({
      userId: user?.id || null,
      action: 'NOTIFICATION_FREQUENCY_RULE_UPDATED',
      entity: 'NotificationFrequencyRule',
      entityId: id,
      previousValue: current,
      newValue: updated,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return updated;
  },

  async toggleFrequencyRule(id, user, context = {}) {
    const rule = await ensureFrequencyRuleExists(id);
    const updated = await notificationConfigRepository.updateFrequencyRule(id, { active: !rule.active });

    await auditService.record({
      userId: user?.id || null,
      action: 'NOTIFICATION_FREQUENCY_RULE_UPDATED',
      entity: 'NotificationFrequencyRule',
      entityId: id,
      previousValue: { active: rule.active },
      newValue: { active: updated.active },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return updated;
  }
};

module.exports = { notificationConfigService };
