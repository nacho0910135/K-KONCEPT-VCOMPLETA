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

export const roleLabel = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Tecnico',
  CLIENT: 'Cliente'
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
  WAITING_CUSTOMER: 'En espera del cliente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
  REOPENED: 'Reabierto'
};

export const eventLabel = {
  TICKET_CREATED: 'Ticket creado',
  TICKET_ASSIGNED: 'Ticket asignado',
  TICKET_RESOLVED: 'Ticket resuelto',
  TICKET_CLOSED: 'Ticket cerrado',
  STATUS_CHANGED: 'Cambio de estado',
  NEW_COMMENT: 'Nuevo comentario',
  APPOINTMENT_RESCHEDULED: 'Cita reprogramada',
  REPLACEMENT_APPROVED: 'Reemplazo aprobado',
  COMMENT_CREATED: 'Comentario creado',
  SLA_RISK: 'Riesgo de SLA',
  SLA_BREACH: 'SLA vencido',
  EXPORT_REQUESTED: 'Exportacion solicitada',
  SCHEDULED_REPORT_UPDATED: 'Reporte programado actualizado',
  LOGIN_SUCCESS: 'Inicio de sesion correcto',
  LOGIN_FAILURE: 'Inicio de sesion fallido',
  TICKET_STATUS_CHANGED: 'Estado de ticket actualizado',
  TICKET_PRIORITY_CHANGED: 'Prioridad actualizada',
  PRIORITY_CHANGED: 'Prioridad actualizada',
  USER_DEACTIVATED: 'Usuario desactivado'
};

export const channelLabel = {
  EMAIL: 'Correo',
  SMS: 'SMS',
  PUSH: 'Push',
  IN_APP: 'En la plataforma'
};

export const resultLabel = {
  SUCCESS: 'Exito',
  FAILURE: 'Error'
};

export const frequencyLabel = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual'
};

export const reportTypeLabel = {
  KPI_OVERVIEW: 'Resumen KPI',
  TICKETS: 'Tickets',
  AUDIT: 'Auditoria',
  SLA: 'SLA',
  'KPI Overview': 'Resumen KPI',
  Tickets: 'Tickets',
  Auditoria: 'Auditoria'
};

export const StateBadge = ({ value }) => <Badge tone={statusTone[value] || 'neutral'}>{statusLabel[value] || value}</Badge>;
export const PriorityBadge = ({ value }) => <Badge tone={priorityTone[value] || 'neutral'}>{priorityLabel[value] || value}</Badge>;
export const RoleBadge = ({ value }) => <Badge tone={roleTone[value] || 'neutral'}>{roleLabel[value] || value}</Badge>;

export const optionize = (items, labels = {}) => items.map((item) => ({ value: item, label: labels[item] || item }));
