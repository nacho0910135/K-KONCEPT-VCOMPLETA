export const technicianTickets = [
  {
    id: 'tt-1',
    code: 'KK-2041',
    title: 'Switch principal sin enlace',
    client: { name: 'Laura Campos', company: 'Grupo Norte', phone: '7000-1100', email: 'laura@norte.com' },
    priority: 'CRITICAL',
    status: 'ASSIGNED',
    category: 'Redes',
    subcategory: 'Switch / cableado',
    createdAt: '2026-05-21T07:20:00',
    slaHoursLeft: 1.4,
    description: 'El switch principal de oficinas administrativas no levanta enlace en dos puertos criticos.',
    product: { brand: 'Cisco', model: 'CBS250', serial: 'CS-CBS-2219', warrantyStatus: 'VIGENTE' },
    replacement: null
  },
  {
    id: 'tt-2',
    code: 'KK-2038',
    title: 'Impresora atasca papel',
    client: { name: 'Marco Salas', company: 'Clinica Este', phone: '7100-2211', email: 'marco@clinicaeste.com' },
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    category: 'Impresoras',
    subcategory: 'Atasco de papel',
    createdAt: '2026-05-20T11:45:00',
    slaHoursLeft: 3.5,
    description: 'La impresora del area de admision atasca papel en cada segundo trabajo.',
    product: { brand: 'HP', model: 'LaserJet M404', serial: 'HP-M404-9981', warrantyStatus: 'VIGENTE' },
    replacement: { id: 'rep-1', status: 'DELIVERED', step: 4, pdfUrl: '#' }
  },
  {
    id: 'tt-3',
    code: 'KK-2034',
    title: 'Camara bodega offline',
    client: { name: 'Sofia Rojas', company: 'Logistica Central', phone: '7200-8841', email: 'sofia@logistica.com' },
    priority: 'MEDIUM',
    status: 'WAITING_CUSTOMER',
    category: 'CCTV',
    subcategory: 'Camara offline',
    createdAt: '2026-05-19T14:10:00',
    slaHoursLeft: 7.8,
    description: 'Camara del pasillo de bodega aparece offline desde el monitor.',
    product: { brand: 'Hikvision', model: 'Domo 2MP', serial: 'HK-DM-8841', warrantyStatus: 'NO_APLICA' },
    replacement: null
  },
  {
    id: 'tt-4',
    code: 'KK-2029',
    title: 'NVR sin grabacion nocturna',
    client: { name: 'Carlos Mendez', company: 'Industrias Sur', phone: '7300-1901', email: 'carlos@sur.com' },
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    category: 'CCTV',
    subcategory: 'NVR / Grabacion',
    createdAt: '2026-05-18T08:00:00',
    slaHoursLeft: 0.8,
    description: 'NVR no registra video entre 6pm y 6am.',
    product: null,
    replacement: { id: 'rep-2', status: 'VALIDATION', step: 2, pdfUrl: null }
  },
  {
    id: 'tt-5',
    code: 'KK-2024',
    title: 'Cambio de toner completado',
    client: { name: 'Laura Campos', company: 'Grupo Norte', phone: '7000-1100', email: 'laura@norte.com' },
    priority: 'LOW',
    status: 'RESOLVED',
    category: 'Impresoras',
    subcategory: 'Consumibles',
    createdAt: '2026-05-05T09:20:00',
    slaHoursLeft: 18,
    description: 'Reemplazo de consumible y prueba de impresion.',
    product: { brand: 'HP', model: 'LaserJet M404', serial: 'HP-M404-9981', warrantyStatus: 'VIGENTE' },
    replacement: null
  }
];

export const technicianTicketDetail = {
  diagnosis: 'Pendiente de validar conectividad fisica y estado del puerto.',
  evidences: [
    { id: 'ev-t-1', name: 'foto-cliente-panel.jpg', type: 'image', uploadedBy: 'CLIENT', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80', size: '1.8 MB' },
    { id: 'ev-t-2', name: 'video-falla.mp4', type: 'video', uploadedBy: 'CLIENT', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', size: '5.2 MB' },
    { id: 'ev-t-3', name: 'checklist-red.pdf', type: 'pdf', uploadedBy: 'TECHNICIAN', url: '#', size: '220 KB' }
  ],
  history: [
    { id: 'h-1', action: 'Ticket asignado', user: 'Admin Kollab', type: 'ASSIGNMENT', createdAt: '2026-05-21T07:25:00', comment: 'Asignado por criticidad y cercania.' },
    { id: 'h-2', action: 'Comentario agregado', user: 'Laura Campos', type: 'COMMENT', createdAt: '2026-05-21T07:42:00', comment: 'El area administrativa esta sin red.' },
    { id: 'h-3', action: 'Evidencia adjunta', user: 'Laura Campos', type: 'EVIDENCE', createdAt: '2026-05-21T07:44:00', comment: 'Foto del panel frontal.' }
  ],
  comments: [
    { id: 'c-1', author: 'Laura Campos', role: 'CLIENT', body: 'Necesitamos prioridad porque afecta facturacion.', createdAt: '2026-05-21T07:42:00' },
    { id: 'c-2', author: 'Andres Mora', role: 'TECHNICIAN', body: 'Voy en camino con cableado de prueba.', createdAt: '2026-05-21T08:05:00' }
  ]
};

export const technicianNotifications = [
  { id: 'tn-1', title: 'Nuevo comentario', message: 'Cliente agrego comentario en KK-2041.', ticketId: 'tt-1', read: false, createdAt: '2026-05-21T08:12:00' },
  { id: 'tn-2', title: 'Ticket asignado', message: 'Se te asigno KK-2038.', ticketId: 'tt-2', read: false, createdAt: '2026-05-20T11:45:00' },
  { id: 'tn-3', title: 'Cambio de estado', message: 'KK-2024 fue marcado como resuelto.', ticketId: 'tt-5', read: true, createdAt: '2026-05-18T13:20:00' }
];

export const priorityWeight = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};
