import Badge from '../../components/common/Badge.jsx';

export const clientStatusLabels = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En proceso',
  WAITING_CUSTOMER: 'Esperando cliente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
  REOPENED: 'Reabierto'
};

export const clientStatusTones = {
  OPEN: 'success',
  IN_PROGRESS: 'primary',
  WAITING_CUSTOMER: 'warning',
  RESOLVED: 'purple',
  CLOSED: 'neutral',
  CANCELLED: 'danger',
  REOPENED: 'warning'
};

export const priorityLabels = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica'
};

export const ClientStatusBadge = ({ status }) => <Badge tone={clientStatusTones[status] || 'neutral'}>{clientStatusLabels[status] || status}</Badge>;
export const ClientPriorityBadge = ({ priority }) => <Badge tone={priority === 'CRITICAL' || priority === 'HIGH' ? 'danger' : priority === 'MEDIUM' ? 'warning' : 'neutral'}>{priorityLabels[priority] || priority}</Badge>;

export const warrantyTone = {
  VIGENTE: 'success',
  EXPIRADA: 'danger',
  NO_APLICA: 'neutral'
};

export const simulateClientAction = () => new Promise((resolve) => {
  window.setTimeout(resolve, 350);
});

export const currentClientId = 'client-1';
