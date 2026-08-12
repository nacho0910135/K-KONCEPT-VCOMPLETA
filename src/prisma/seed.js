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
  'TICKET_APPEALED',
  'APPOINTMENT_RESCHEDULED',
  'REPLACEMENT_APPROVED',
  'REFUND_REGISTERED',
  'SLA_BREACH'
];

const channels = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'];

const initialCategories = [
  {
    name: 'Impresoras',
    description: 'Equipos de impresion, toner, papel y mantenimiento.',
    subcategories: [
      { name: 'Atasco de papel', description: 'Papel trabado, bandejas o rodillos.' },
      { name: 'Consumibles', description: 'Toner, tinta, tambor y otros insumos.' }
    ]
  },
  {
    name: 'Redes',
    description: 'Conectividad, switches, routers y puntos de red.',
    subcategories: [
      { name: 'WiFi', description: 'Problemas de senal, acceso o cobertura.' },
      { name: 'Switch / cableado', description: 'Puertos, enlaces y cableado fisico.' }
    ]
  },
  {
    name: 'CCTV',
    description: 'Camaras, NVR, grabacion y monitoreo.',
    subcategories: [
      { name: 'Camara offline', description: 'Camara sin conexion o sin imagen.' },
      { name: 'NVR / Grabacion', description: 'Grabacion, almacenamiento y reproduccion.' }
    ]
  }
];

const templateCopy = {
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
    subject: 'Ticket {{ticketCode}} resuelto',
    body: 'Hola {{userName}}, el ticket {{ticketCode}} quedo finalizado. Gracias por confirmar la atencion recibida.'
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
    body: 'Hola {{userName}}, el ticket {{ticketCode}} excedio su fecha limite de atencion. Nuestro equipo debe priorizar el seguimiento.'
  }
};

const inAppTemplateCopy = {
  TICKET_CREATED: {
    subject: 'Ticket {{ticketCode}} creado',
    body: 'Hola {{userName}}, recibimos tu ticket {{ticketCode}}. Prioridad: {{priority}}. Estado: {{status}}.'
  },
  TICKET_ASSIGNED: templateCopy.TICKET_ASSIGNED,
  STATUS_CHANGED: templateCopy.STATUS_CHANGED,
  NEW_COMMENT: templateCopy.NEW_COMMENT,
  TICKET_RESOLVED: templateCopy.TICKET_RESOLVED,
  TICKET_CLOSED: templateCopy.TICKET_CLOSED,
  TICKET_APPEALED: templateCopy.TICKET_APPEALED,
  APPOINTMENT_RESCHEDULED: templateCopy.APPOINTMENT_RESCHEDULED,
  REPLACEMENT_APPROVED: templateCopy.REPLACEMENT_APPROVED,
  REFUND_REGISTERED: templateCopy.REFUND_REGISTERED,
  SLA_BREACH: templateCopy.SLA_BREACH
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
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Qdtb123456*';
  const technicianPassword = process.env.TECHNICIAN_INITIAL_PASSWORD || 'Qdtb123456*';
  const clientPassword = process.env.CLIENT_INITIAL_PASSWORD || 'Qdtb123456*';
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
    name: 'Tecnico Kollab',
    password: technicianPassword,
    role: 'TECHNICIAN',
    active: true
  });

  const client = await upsertUser({
    email: CLIENT_EMAIL,
    name: 'Cliente Kollab',
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

async function seedCategories() {
  for (const category of initialCategories) {
    const savedCategory = await prisma.category.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
        active: true
      },
      create: {
        name: category.name,
        description: category.description,
        active: true
      }
    });

    for (const subcategory of category.subcategories) {
      await prisma.subcategory.upsert({
        where: {
          name_categoryId: {
            name: subcategory.name,
            categoryId: savedCategory.id
          }
        },
        update: {
          description: subcategory.description,
          active: true
        },
        create: {
          categoryId: savedCategory.id,
          name: subcategory.name,
          description: subcategory.description,
          active: true
        }
      });
    }
  }

  logger.info({ count: initialCategories.length }, 'Categorias iniciales creadas o actualizadas');
}

async function seedNotificationTemplates() {
  const templates = notificationEvents.flatMap((event) => (
    ['EMAIL', 'IN_APP'].map((channel) => {
      const copy = channel === 'EMAIL' ? templateCopy[event] : inAppTemplateCopy[event];
      return {
        event,
        channel,
        subject: channel === 'EMAIL' ? copy.subject : copy.subject,
        bodyTemplate: copy.body,
        active: true
      };
    })
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
  await seedCategories();
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
