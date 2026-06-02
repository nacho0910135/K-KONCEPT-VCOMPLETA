const nodemailer = require('nodemailer');

const { env } = require('../config/env');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

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

const parseAddress = (address) => {
  if (typeof address === 'object' && address?.email) return address;

  const value = String(address || '').trim();
  const match = value.match(/^(.*?)\s*<([^>]+)>$/);

  if (match) {
    return {
      name: match[1].replace(/^"|"$/g, '').trim() || undefined,
      email: match[2].trim()
    };
  }

  return { email: value };
};

const normalizeRecipients = (value) => {
  if (Array.isArray(value)) return value.map(parseAddress);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(parseAddress);
};

const normalizeAttachments = (attachments = []) => attachments.map((attachment) => {
  const content = Buffer.isBuffer(attachment.content)
    ? attachment.content.toString('base64')
    : Buffer.from(String(attachment.content || '')).toString('base64');

  return {
    name: attachment.filename || attachment.name || 'attachment',
    content
  };
});

const sendWithBrevoApi = async (options) => {
  const payload = {
    sender: parseAddress(options.from || env.mail.from),
    to: normalizeRecipients(options.to),
    subject: options.subject,
    htmlContent: options.html,
    textContent: options.text
  };

  if (options.cc) payload.cc = normalizeRecipients(options.cc);
  if (options.bcc) payload.bcc = normalizeRecipients(options.bcc);
  if (options.replyTo) payload.replyTo = parseAddress(options.replyTo);
  if (options.headers) payload.headers = options.headers;
  if (options.attachments?.length) payload.attachment = normalizeAttachments(options.attachments);

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': env.brevo.apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Brevo API error ${response.status}`);
    error.code = data.code || 'BREVO_API_ERROR';
    error.responseCode = response.status;
    error.response = data;
    throw error;
  }

  return {
    accepted: payload.to.map((recipient) => recipient.email),
    rejected: [],
    response: `Brevo API accepted ${data.messageId || ''}`.trim(),
    messageId: data.messageId,
    provider: 'brevo-api'
  };
};

const mailer = {
  async sendMail(options) {
    if (env.brevo.apiKey) {
      try {
        return await sendWithBrevoApi(options);
      } catch (error) {
        if (!transporter) throw error;
        error.apiFallback = true;
      }
    }

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
