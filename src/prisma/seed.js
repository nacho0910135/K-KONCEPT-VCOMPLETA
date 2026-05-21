const bcrypt = require('bcrypt');

const { prisma } = require('../config/database');
const { logger } = require('../utils/logger');

const ADMIN_EMAIL = 'admin@kollabkoncepts.com';
const TECHNICIAN_EMAIL = 'tecnico@kollabkoncepts.com';
const CLIENT_EMAIL = 'cliente@kollabkoncepts.com';
const SYSTEM_EMAIL = 'system@kollabkoncepts.internal';

const notificationEvents = [
  'TICKET_CREATED',
  'TICKET_ASSIGNED',
  'STATUS_CHANGED',
  'NEW_COMMENT',
  'TICKET_RESOLVED',
  'TICKET_CLOSED',
  'APPOINTMENT_RESCHEDULED',
  'REPLACEMENT_APPROVED',
  'SLA_BREACH'
];

const channels = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'];

const templateCopy = {
  TICKET_CREATED: {
    subject: 'Ticket {{ticketCode}} creado',
    body: 'Hola {{userName}}, el ticket {{ticketCode}} fue creado correctamente.'
  },
  TICKET_ASSIGNED: {
    subject: 'Ticket {{ticketCode}} asignado',
    body: 'El ticket {{ticketCode}} fue asignado a {{technicianName}}.'
  },
  STATUS_CHANGED: {
    subject: 'Ticket {{ticketCode}} cambio de estado',
    body: 'El ticket {{ticketCode}} cambio de {{previousStatus}} a {{newStatus}}.'
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
    body: 'El ticket {{ticketCode}} excedio su fecha limite de SLA.'
  }
};

async function upsertUser({ email, name, password, role, active }) {
  const hashedPassword = await bcrypt.hash(password, 12);

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role,
      active
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role,
      active
    }
  });
}

async function seedUsers() {
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'ChangeMe.Admin.2026!';
  const technicianPassword = process.env.TECHNICIAN_INITIAL_PASSWORD || 'ChangeMe.Tech.2026!';
  const clientPassword = process.env.CLIENT_INITIAL_PASSWORD || 'ChangeMe.Client.2026!';
  const systemPassword = process.env.SYSTEM_INITIAL_PASSWORD || 'system-account-disabled';

  const admin = await upsertUser({
    email: ADMIN_EMAIL,
    name: 'Administrador Kollab Koncepts',
    password: adminPassword,
    role: 'ADMIN',
    active: true
  });

  const technician = await upsertUser({
    email: TECHNICIAN_EMAIL,
    name: 'Tecnico Demo Kollab',
    password: technicianPassword,
    role: 'TECHNICIAN',
    active: true
  });

  const client = await upsertUser({
    email: CLIENT_EMAIL,
    name: 'Cliente Demo Kollab',
    password: clientPassword,
    role: 'CLIENT',
    active: true
  });

  const system = await upsertUser({
    email: SYSTEM_EMAIL,
    name: 'Sistema Kollab Koncepts',
    password: systemPassword,
    role: 'SYSTEM',
    active: false
  });

  logger.info({
    adminEmail: admin.email,
    technicianEmail: technician.email,
    clientEmail: client.email,
    systemEmail: system.email
  }, 'Usuarios iniciales creados o actualizados');
}

async function seedTicketCounter() {
  const year = new Date().getFullYear();

  await prisma.ticketCounter.upsert({
    where: { year },
    update: {},
    create: {
      id: `TICKET_COUNTER_${year}`,
      year,
      count: 0
    }
  });

  logger.info({ year }, 'TicketCounter inicial creado o validado');
}

async function seedNotificationTemplates() {
  const templates = notificationEvents.flatMap((event) => (
    ['EMAIL', 'IN_APP'].map((channel) => ({
      event,
      channel,
      subject: channel === 'EMAIL' ? templateCopy[event].subject : null,
      bodyTemplate: templateCopy[event].body,
      active: true
    }))
  ));

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: {
        event_channel: {
          event: template.event,
          channel: template.channel
        }
      },
      update: {
        subject: template.subject,
        bodyTemplate: template.bodyTemplate,
        active: template.active
      },
      create: template
    });
  }

  logger.info({ count: templates.length }, 'Plantillas de notificacion creadas o actualizadas');
}

async function seedNotificationChannelsConfig() {
  for (const channel of channels) {
    await prisma.notificationChannelsConfig.upsert({
      where: { channel },
      update: {
        enabled: channel === 'IN_APP',
        config: {}
      },
      create: {
        channel,
        enabled: channel === 'IN_APP',
        config: {}
      }
    });
  }

  logger.info({ channels }, 'Configuracion inicial de canales de notificacion creada o actualizada');
}

async function seedNotificationFrequencyRules() {
  for (const event of notificationEvents) {
    await prisma.notificationFrequencyRule.upsert({
      where: { event },
      update: {},
      create: {
        event,
        maxPerUserPerHour: 20,
        maxPerUserPerDay: 100,
        active: true
      }
    });
  }

  logger.info({ count: notificationEvents.length }, 'Reglas de frecuencia de notificacion creadas o validadas');
}

async function main() {
  await seedUsers();
  await seedTicketCounter();
  await seedNotificationTemplates();
  await seedNotificationChannelsConfig();
  await seedNotificationFrequencyRules();
}

main()
  .catch((error) => {
    logger.error({ error }, 'Error ejecutando seed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
