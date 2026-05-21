import Badge from '../../components/common/Badge.jsx';

export const technicianStatusLabels = {
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En progreso',
  WAITING_CUSTOMER: 'Esperando cliente',
  RESOLVED: 'Resuelto',
  REOPENED: 'Reabierto'
};

export const technicianStatusTone = {
  ASSIGNED: 'primary',
  IN_PROGRESS: 'warning',
  WAITING_CUSTOMER: 'neutral',
  RESOLVED: 'success',
  REOPENED: 'warning'
};

export const priorityLabels = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica'
};

export const PriorityBadge = ({ priority }) => (
  <Badge tone={priority === 'CRITICAL' ? 'danger' : priority === 'HIGH' ? 'warning' : priority === 'MEDIUM' ? 'primary' : 'neutral'}>
    {priorityLabels[priority] || priority}
  </Badge>
);

export const TechnicianStatusBadge = ({ status }) => <Badge tone={technicianStatusTone[status] || 'neutral'}>{technicianStatusLabels[status] || status}</Badge>;

export const SlaBadge = ({ hours }) => (
  <Badge tone={hours < 2 ? 'danger' : hours < 6 ? 'warning' : 'success'}>
    {hours < 1 ? `${Math.round(hours * 60)} min` : `${hours.toFixed(1)} h`}
  </Badge>
);

export const allowedTransitions = {
  ASSIGNED: ['IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED'],
  IN_PROGRESS: ['WAITING_CUSTOMER', 'RESOLVED'],
  WAITING_CUSTOMER: ['IN_PROGRESS', 'RESOLVED'],
  REOPENED: ['IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED'],
  RESOLVED: []
};

export const simulateTechnicianAction = () => new Promise((resolve) => {
  window.setTimeout(resolve, 350);
});
