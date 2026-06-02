require('dotenv').config();

const { z } = require('zod');

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_EXPIRES_IN: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  BREVO_API_KEY: z.string().optional().default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanFromEnv.default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  MAIL_FROM: z.string().default('Kollab Koncepts <no-reply@kollabkoncepts.com>'),
  ENABLE_CRON_JOBS: booleanFromEnv.default(true),
  BLOCK_TICKET_WITHOUT_WARRANTY: booleanFromEnv.default(false),
  APPOINTMENT_SLOT_MINUTES: z.coerce.number().int().positive().default(60),
  WORK_START_HOUR: z.coerce.number().int().min(0).max(23).default(8),
  WORK_END_HOUR: z.coerce.number().int().min(1).max(24).default(18),
  WORK_DAYS: z.string().default('1,2,3,4,5'),
  TICKET_CLEANUP_CRON: z.string().default('0 3 * * *'),
  SLA_CHECK_CRON: z.string().default('*/15 * * * *'),
  SCHEDULED_REPORTS_CRON: z.string().default('0 * * * *')
}).superRefine((values, ctx) => {
  if (values.NODE_ENV === 'production' && values.JWT_SECRET.length < 48) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'JWT_SECRET debe tener al menos 48 caracteres en produccion'
    });
  }

  if (values.NODE_ENV === 'production' && values.CORS_ORIGINS.includes('*')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGINS'],
      message: 'CORS_ORIGINS no debe usar comodines en produccion'
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno invalidas', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const values = parsed.data;

const env = {
  nodeEnv: values.NODE_ENV,
  isProduction: values.NODE_ENV === 'production',
  port: values.PORT,
  appUrl: values.APP_URL,
  apiPrefix: values.API_PREFIX,
  corsOrigins: values.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  databaseUrl: values.DATABASE_URL,
  jwt: {
    secret: values.JWT_SECRET,
    accessExpiresIn: values.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: values.JWT_REFRESH_EXPIRES_IN,
    expiresIn: values.JWT_ACCESS_EXPIRES_IN
  },
  cloudinary: {
    cloudName: values.CLOUDINARY_CLOUD_NAME,
    apiKey: values.CLOUDINARY_API_KEY,
    apiSecret: values.CLOUDINARY_API_SECRET
  },
  brevo: {
    apiKey: values.BREVO_API_KEY
  },
  mail: {
    host: values.SMTP_HOST,
    port: values.SMTP_PORT,
    secure: values.SMTP_SECURE,
    user: values.SMTP_USER,
    pass: values.SMTP_PASS,
    from: values.MAIL_FROM
  },
  cron: {
    enabled: values.ENABLE_CRON_JOBS,
    ticketCleanup: values.TICKET_CLEANUP_CRON,
    slaCheck: values.SLA_CHECK_CRON,
    scheduledReports: values.SCHEDULED_REPORTS_CRON
  },
  tickets: {
    blockWithoutWarranty: values.BLOCK_TICKET_WITHOUT_WARRANTY
  },
  appointments: {
    slotMinutes: values.APPOINTMENT_SLOT_MINUTES,
    workStartHour: values.WORK_START_HOUR,
    workEndHour: values.WORK_END_HOUR,
    workDays: values.WORK_DAYS.split(',').map((day) => Number(day.trim())).filter((day) => !Number.isNaN(day))
  }
};

module.exports = { env };
