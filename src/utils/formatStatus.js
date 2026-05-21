const statusLabels = {
  OPEN: 'Abierto',
  ASSIGNED: 'Asignado',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  WAITING_CUSTOMER: 'En espera del cliente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
  REOPENED: 'Reabierto'
};

export const formatStatus = (status) => statusLabels[status] || status || 'Sin estado';
