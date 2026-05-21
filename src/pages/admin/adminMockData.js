export const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const statuses = ['OPEN', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const categories = [
  {
    id: 'cat-1',
    name: 'Impresoras',
    description: 'Soporte para equipos de impresion',
    active: true,
    subcategories: [
      { id: 'sub-1', name: 'Atascos', description: 'Papel atascado o sensores', active: true },
      { id: 'sub-2', name: 'Consumibles', description: 'Toner, tambor y repuestos', active: true }
    ]
  },
  {
    id: 'cat-2',
    name: 'Redes',
    description: 'Conectividad, switches y cableado',
    active: true,
    subcategories: [
      { id: 'sub-3', name: 'Cableado', description: 'Puntos de red y patch panel', active: true },
      { id: 'sub-4', name: 'WiFi', description: 'Cobertura y autenticacion', active: false }
    ]
  },
  {
    id: 'cat-3',
    name: 'CCTV',
    description: 'Camaras, NVR y monitoreo',
    active: true,
    subcategories: [
      { id: 'sub-5', name: 'Camara offline', description: 'Revision de enlace y energia', active: true }
    ]
  }
];

export const technicians = [
  { id: 'tech-1', name: 'Mariana Solis', email: 'mariana@kollab.com', active: true, resolutions: 46, rating: 4.8 },
  { id: 'tech-2', name: 'Andres Mora', email: 'andres@kollab.com', active: true, resolutions: 39, rating: 4.7 },
  { id: 'tech-3', name: 'Paola Vega', email: 'paola@kollab.com', active: true, resolutions: 34, rating: 4.6 },
  { id: 'tech-4', name: 'Luis Rojas', email: 'luis@kollab.com', active: false, resolutions: 21, rating: 4.4 }
];

export const users = [
  { id: 'usr-1', name: 'Admin Kollab', email: 'admin@kollab.com', role: 'ADMIN', active: true, phone: '2222-1000', company: 'Kollab Koncepts' },
  ...technicians.map((tech) => ({ ...tech, role: 'TECHNICIAN', phone: '8888-1000', company: 'Kollab Koncepts' })),
  { id: 'usr-6', name: 'Cliente Norte', email: 'soporte@norte.com', role: 'CLIENT', active: true, phone: '7000-1212', company: 'Grupo Norte' },
  { id: 'usr-7', name: 'Cliente Sur', email: 'tickets@sur.com', role: 'CLIENT', active: false, phone: '7000-1313', company: 'Industrias Sur' }
];

export const tickets = [
  { id: 't-1', code: 'KK-1024', title: 'Impresora no responde', client: 'Grupo Norte', status: 'OPEN', priority: 'HIGH', technicianId: 'tech-1', technician: 'Mariana Solis', category: 'Impresoras', createdAt: '2026-05-01', dueAt: '2026-05-02', slaMet: true },
  { id: 't-2', code: 'KK-1025', title: 'Switch sin enlace', client: 'Industrias Sur', status: 'IN_PROGRESS', priority: 'CRITICAL', technicianId: 'tech-2', technician: 'Andres Mora', category: 'Redes', createdAt: '2026-05-03', dueAt: '2026-05-03', slaMet: false },
  { id: 't-3', code: 'KK-1026', title: 'Camara offline bodega', client: 'Logistica Central', status: 'PENDING', priority: 'MEDIUM', technicianId: 'tech-3', technician: 'Paola Vega', category: 'CCTV', createdAt: '2026-05-04', dueAt: '2026-05-06', slaMet: true },
  { id: 't-4', code: 'KK-1027', title: 'Toner bajo', client: 'Grupo Norte', status: 'RESOLVED', priority: 'LOW', technicianId: 'tech-1', technician: 'Mariana Solis', category: 'Impresoras', createdAt: '2026-05-05', dueAt: '2026-05-08', slaMet: true },
  { id: 't-5', code: 'KK-1028', title: 'Punto de red intermitente', client: 'Clinica Este', status: 'CLOSED', priority: 'HIGH', technicianId: 'tech-2', technician: 'Andres Mora', category: 'Redes', createdAt: '2026-05-07', dueAt: '2026-05-09', slaMet: true },
  { id: 't-6', code: 'KK-1029', title: 'NVR sin grabacion', client: 'Logistica Central', status: 'OPEN', priority: 'CRITICAL', technicianId: 'tech-3', technician: 'Paola Vega', category: 'CCTV', createdAt: '2026-05-10', dueAt: '2026-05-11', slaMet: false }
];

export const ticketDetail = {
  description: 'Equipo reportado por el cliente con falla recurrente. Se requiere diagnostico, evidencia y cierre documentado.',
  timeline: [
    { id: 'e-1', title: 'Ticket creado', description: 'Solicitud recibida desde portal cliente.', createdAt: '2026-05-01T08:30:00' },
    { id: 'e-2', title: 'Tecnico asignado', description: 'Asignado a Mariana Solis por disponibilidad.', createdAt: '2026-05-01T08:42:00' },
    { id: 'e-3', title: 'Comentario interno', description: 'Se agenda visita para primera hora.', createdAt: '2026-05-01T09:05:00' }
  ],
  comments: [
    { id: 'c-1', author: 'Cliente Norte', body: 'La impresora muestra error E05.', createdAt: '2026-05-01T08:31:00' },
    { id: 'c-2', author: 'Mariana Solis', body: 'Solicito foto del panel para validar codigo.', createdAt: '2026-05-01T09:10:00' }
  ],
  evidence: ['foto-panel-error.jpg', 'diagnostico-inicial.pdf'],
  history: [
    { field: 'priority', from: 'MEDIUM', to: 'HIGH', by: 'Admin Kollab', at: '2026-05-01T08:45:00' }
  ]
};

export const dashboard = {
  summary: { open: 18, inProgress: 11, pending: 7, resolved: 64, closed: 130, slaMet: 92, rating: 4.7 },
  byPriority: [
    { name: 'Baja', value: 8 },
    { name: 'Media', value: 18 },
    { name: 'Alta', value: 14 },
    { name: 'Critica', value: 5 }
  ],
  monthly: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May'].map((name, index) => ({ name, tickets: 22 + index * 3 + (index % 3) * 4 })),
  categoryDistribution: [
    { name: 'Impresoras', value: 42 },
    { name: 'Redes', value: 31 },
    { name: 'CCTV', value: 19 },
    { name: 'Otros', value: 8 }
  ]
};

export const auditLogs = [
  { id: 'log-1', user: 'Admin Kollab', action: 'TICKET_ASSIGNED', entity: 'Ticket', entityId: 'KK-1024', result: 'SUCCESS', createdAt: '2026-05-20T10:05:00', ip: '190.10.20.4', userAgent: 'Chrome Windows', before: { technician: null }, after: { technician: 'Mariana Solis' } },
  { id: 'log-2', user: 'Admin Kollab', action: 'PRIORITY_CHANGED', entity: 'Ticket', entityId: 'KK-1025', result: 'SUCCESS', createdAt: '2026-05-20T09:55:00', ip: '190.10.20.4', userAgent: 'Chrome Windows', before: { priority: 'HIGH' }, after: { priority: 'CRITICAL' } },
  { id: 'log-3', user: 'Paola Vega', action: 'COMMENT_CREATED', entity: 'TicketComment', entityId: 'c-22', result: 'SUCCESS', createdAt: '2026-05-20T09:34:00', ip: '190.10.20.8', userAgent: 'Edge Windows', before: {}, after: { body: 'Visita completada' } },
  { id: 'log-4', user: 'Admin Kollab', action: 'USER_DEACTIVATED', entity: 'User', entityId: 'usr-7', result: 'SUCCESS', createdAt: '2026-05-19T16:30:00', ip: '190.10.20.4', userAgent: 'Chrome Windows', before: { active: true }, after: { active: false } }
];

export const slas = [
  { id: 'sla-1', name: 'Critico general', scope: 'Prioridad CRITICAL', maxResponseHours: 1, maxResolutionHours: 8, active: true, exception: false },
  { id: 'sla-2', name: 'Cliente Grupo Norte', scope: 'Cliente Grupo Norte', maxResponseHours: 2, maxResolutionHours: 12, active: true, exception: true },
  { id: 'sla-3', name: 'Impresoras alta', scope: 'Categoria Impresoras + HIGH', maxResponseHours: 3, maxResolutionHours: 18, active: true, exception: true }
];

export const slaVersions = [
  { id: 'v1', version: 1, changedAt: '2026-03-01', changedBy: 'Admin Kollab', response: 4, resolution: 24 },
  { id: 'v2', version: 2, changedAt: '2026-04-15', changedBy: 'Admin Kollab', response: 2, resolution: 12 }
];

export const templates = [
  { id: 'tpl-1', event: 'TICKET_CREATED', channel: 'EMAIL', subject: 'Ticket {{code}} creado', body: 'Hola {{clientName}}, recibimos tu solicitud.', active: true },
  { id: 'tpl-2', event: 'TICKET_ASSIGNED', channel: 'IN_APP', subject: '', body: 'El ticket {{code}} fue asignado a {{technicianName}}.', active: true },
  { id: 'tpl-3', event: 'SLA_RISK', channel: 'SMS', subject: '', body: 'Ticket {{code}} en riesgo de SLA.', active: false }
];

export const channels = [
  { id: 'IN_APP', name: 'IN_APP', enabled: true, fields: ['retentionDays'] },
  { id: 'EMAIL', name: 'EMAIL', enabled: true, fields: ['smtpHost', 'smtpPort', 'smtpUser'] },
  { id: 'SMS', name: 'SMS', enabled: false, fields: ['twilioSid', 'twilioToken', 'fromNumber'] },
  { id: 'PUSH', name: 'PUSH', enabled: false, fields: ['fcmKey', 'projectId'] }
];

export const frequencyRules = [
  { id: 'freq-1', event: 'TICKET_CREATED', maxPerUserPerHour: 6, maxPerUserPerDay: 20, active: true },
  { id: 'freq-2', event: 'SLA_RISK', maxPerUserPerHour: 3, maxPerUserPerDay: 10, active: true },
  { id: 'freq-3', event: 'COMMENT_CREATED', maxPerUserPerHour: 8, maxPerUserPerDay: 40, active: false }
];

export const scheduledReports = [
  { id: 'rep-1', type: 'KPI Overview', frequency: 'WEEKLY', recipients: ['admin@kollab.com'], format: 'PDF', active: true },
  { id: 'rep-2', type: 'SLA', frequency: 'MONTHLY', recipients: ['gerencia@kollab.com', 'ops@kollab.com'], format: 'Excel', active: true }
];
