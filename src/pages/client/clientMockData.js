export const clientCategories = [
  {
    id: 'cat-printers',
    name: 'Impresoras',
    subcategories: [
      { id: 'sub-jam', name: 'Atasco de papel' },
      { id: 'sub-toner', name: 'Consumibles' }
    ]
  },
  {
    id: 'cat-network',
    name: 'Redes',
    subcategories: [
      { id: 'sub-wifi', name: 'WiFi' },
      { id: 'sub-switch', name: 'Switch / cableado' }
    ]
  },
  {
    id: 'cat-cctv',
    name: 'CCTV',
    subcategories: [
      { id: 'sub-camera', name: 'Camara offline' },
      { id: 'sub-nvr', name: 'NVR / Grabacion' }
    ]
  }
];

export const clientProducts = [
  { id: 'prod-1', name: 'HP LaserJet M404', serial: 'HP-M404-9981', warrantyStatus: 'VIGENTE', warrantyEndsAt: '2026-09-30', daysLeft: 132 },
  { id: 'prod-2', name: 'Switch Cisco CBS250', serial: 'CS-CBS-2219', warrantyStatus: 'EXPIRADA', warrantyEndsAt: '2025-12-14', daysLeft: 0 },
  { id: 'prod-3', name: 'Camara Hikvision Domo', serial: 'HK-DM-8841', warrantyStatus: 'NO_APLICA', warrantyEndsAt: null, daysLeft: null }
];

export const clientTickets = [
  {
    id: 'ct-1',
    code: 'KK-1024',
    title: 'Impresora no responde',
    status: 'OPEN',
    priority: 'HIGH',
    category: 'Impresoras',
    subcategory: 'Atasco de papel',
    productId: 'prod-1',
    technician: null,
    createdAt: '2026-05-18T08:30:00',
    description: 'La impresora no responde desde la bandeja principal y muestra error intermitente.',
    ownerId: 'client-1'
  },
  {
    id: 'ct-2',
    code: 'KK-1025',
    title: 'WiFi intermitente en sala norte',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    category: 'Redes',
    subcategory: 'WiFi',
    productId: null,
    technician: { name: 'Andres Mora', avatar: 'AM' },
    createdAt: '2026-05-15T10:15:00',
    description: 'El acceso WiFi se desconecta cada pocos minutos durante reuniones.',
    ownerId: 'client-1'
  },
  {
    id: 'ct-3',
    code: 'KK-1026',
    title: 'Camara bodega offline',
    status: 'WAITING_CUSTOMER',
    priority: 'LOW',
    category: 'CCTV',
    subcategory: 'Camara offline',
    productId: 'prod-3',
    technician: { name: 'Paola Vega', avatar: 'PV' },
    createdAt: '2026-05-11T16:25:00',
    description: 'La camara de bodega aparece offline en el monitor principal.',
    ownerId: 'client-1'
  },
  {
    id: 'ct-4',
    code: 'KK-1027',
    title: 'Cambio de toner completado',
    status: 'RESOLVED',
    priority: 'LOW',
    category: 'Impresoras',
    subcategory: 'Consumibles',
    productId: 'prod-1',
    technician: { name: 'Mariana Solis', avatar: 'MS' },
    createdAt: '2026-05-09T09:20:00',
    description: 'Solicitud de cambio de toner y revision general de impresion.',
    ownerId: 'client-1'
  },
  {
    id: 'ct-5',
    code: 'KK-1028',
    title: 'NVR sin grabacion',
    status: 'CLOSED',
    priority: 'CRITICAL',
    category: 'CCTV',
    subcategory: 'NVR / Grabacion',
    productId: null,
    technician: { name: 'Paola Vega', avatar: 'PV' },
    createdAt: '2026-05-02T11:10:00',
    description: 'El NVR no registraba grabaciones nocturnas.',
    ownerId: 'client-1'
  },
  {
    id: 'ct-6',
    code: 'KK-1030',
    title: 'Ticket de otra cuenta',
    status: 'OPEN',
    priority: 'MEDIUM',
    category: 'Redes',
    subcategory: 'Switch / cableado',
    productId: null,
    technician: null,
    createdAt: '2026-05-20T11:10:00',
    description: 'No pertenece al cliente actual.',
    ownerId: 'other-client'
  }
];

export const clientTicketDetail = {
  timeline: [
    { id: 'tl-1', status: 'OPEN', title: 'Ticket creado', comment: 'Solicitud registrada por el cliente.', user: 'Cliente Norte', createdAt: '2026-05-09T09:20:00' },
    { id: 'tl-2', status: 'IN_PROGRESS', title: 'Tecnico asignado', comment: 'Mariana Solis tomo el caso.', user: 'Mesa de ayuda', createdAt: '2026-05-09T09:35:00' },
    { id: 'tl-3', status: 'RESOLVED', title: 'Solucion propuesta', comment: 'Toner reemplazado y pruebas completadas.', user: 'Mariana Solis', createdAt: '2026-05-09T13:10:00' }
  ],
  comments: [
    { id: 'cm-1', author: 'Cliente Norte', fromClient: true, body: 'El equipo no imprimia desde contabilidad.', createdAt: '2026-05-09T09:21:00' },
    { id: 'cm-2', author: 'Mariana Solis', fromClient: false, body: 'Se encontro toner agotado y se completo reemplazo.', createdAt: '2026-05-09T12:48:00' }
  ],
  evidences: [
    { id: 'ev-1', type: 'image', name: 'panel-error.jpg', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80' },
    { id: 'ev-2', type: 'video', name: 'prueba-impresion.mp4', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    { id: 'ev-3', type: 'pdf', name: 'reporte-servicio.pdf', url: '#' }
  ]
};

export const clientNotifications = [
  { id: 'n-1', title: 'Ticket resuelto', message: 'KK-1027 espera tu confirmacion de solucion.', ticketId: 'ct-4', read: false, createdAt: '2026-05-20T14:15:00' },
  { id: 'n-2', title: 'Tecnico asignado', message: 'Andres Mora fue asignado a KK-1025.', ticketId: 'ct-2', read: false, createdAt: '2026-05-19T09:00:00' },
  { id: 'n-3', title: 'Comentario nuevo', message: 'Paola Vega solicito evidencia adicional.', ticketId: 'ct-3', read: true, createdAt: '2026-05-18T16:30:00' }
];

export const unavailableDates = ['2026-05-24', '2026-05-25', '2026-05-31'];
