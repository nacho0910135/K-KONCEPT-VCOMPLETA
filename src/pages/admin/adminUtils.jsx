import Badge from '../../components/common/Badge.jsx';

export const priorityTone = {
  LOW: 'neutral',
  MEDIUM: 'primary',
  HIGH: 'warning',
  CRITICAL: 'danger'
};

export const statusTone = {
  OPEN: 'primary',
  PENDING: 'warning',
  IN_PROGRESS: 'purple',
  RESOLVED: 'success',
  CLOSED: 'neutral'
};

export const roleTone = {
  ADMIN: 'danger',
  TECHNICIAN: 'primary',
  CLIENT: 'neutral'
};

export const priorityLabel = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica'
};

export const statusLabel = {
  OPEN: 'Abierto',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado'
};

export const StateBadge = ({ value }) => <Badge tone={statusTone[value] || 'neutral'}>{statusLabel[value] || value}</Badge>;
export const PriorityBadge = ({ value }) => <Badge tone={priorityTone[value] || 'neutral'}>{priorityLabel[value] || value}</Badge>;
export const RoleBadge = ({ value }) => <Badge tone={roleTone[value] || 'neutral'}>{value}</Badge>;

export const optionize = (items) => items.map((item) => ({ value: item, label: item }));

export const simulateAction = () => new Promise((resolve) => {
  window.setTimeout(resolve, 350);
});
