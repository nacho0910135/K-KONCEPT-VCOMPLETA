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
  WAITING_CUSTOMER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
  CANCELLED: 'danger',
  REOPENED: 'primary'
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
  REFUND_REGISTERED: 'Reembolso registrado',
  COMMENT_CREATED: 'Comentario creado',
  SLA_RISK: 'Riesgo de SLA',
  SLA_BREACH: 'SLA vencido',
  EXPORT_REQUESTED: 'Exportacion solicitada',
  SCHEDULED_REPORT_UPDATED: 'Reporte programado actualizado',
  LOGIN_SUCCESS: 'Inicio de sesion correcto',
  LOGIN_FAILURE: 'Inicio de sesion fallido',
  USER_CREATED: 'Usuario creado',
  USER_UPDATED: 'Usuario actualizado',
  USER_ROLE_CHANGED: 'Rol de usuario actualizado',
  USER_ACTIVATED: 'Usuario activado',
  TICKET_STATUS_CHANGED: 'Estado de ticket actualizado',
  TICKET_APPEALED: 'Ticket apelado',
  TICKET_AUTO_ASSIGNED: 'Ticket autoasignado',
  TICKET_PRIORITY_CHANGED: 'Prioridad actualizada',
  TICKET_UPDATED: 'Ticket actualizado',
  TICKET_DELETED: 'Ticket eliminado',
  TICKET_ACCESS_DENIED: 'Acceso a ticket denegado',
  PRIORITY_CHANGED: 'Prioridad actualizada',
  USER_DEACTIVATED: 'Usuario desactivado',
  WARRANTY_VALIDATED: 'Garantia validada',
  WARRANTY_CREATED: 'Garantia creada',
  WARRANTY_UPDATED: 'Garantia actualizada',
  WARRANTY_DELETED: 'Garantia eliminada',
  EVIDENCE_UPLOADED: 'Evidencia cargada',
  EVIDENCE_DELETED: 'Evidencia eliminada',
  NOTIFICATION_TEMPLATE_UPDATED: 'Plantilla de notificacion actualizada',
  NOTIFICATION_CHANNEL_UPDATED: 'Canal de notificacion actualizado',
  NOTIFICATION_FREQUENCY_RULE_UPDATED: 'Regla de frecuencia actualizada',
  NOTIFICATION_FREQUENCY_RULE_TOGGLED: 'Regla de frecuencia activada/desactivada',
  REPORT_EXPORTED: 'Reporte exportado',
  AUDIT_EXPORTED: 'Auditoria exportada',
  COMMENT_ADDED: 'Comentario agregado',
  CATEGORY_CREATED: 'Categoria creada',
  CATEGORY_UPDATED: 'Categoria actualizada',
  CATEGORY_ACTIVATED: 'Categoria activada',
  CATEGORY_DEACTIVATED: 'Categoria desactivada',
  SUBCATEGORY_CREATED: 'Subcategoria creada',
  SUBCATEGORY_UPDATED: 'Subcategoria actualizada',
  SUBCATEGORY_ACTIVATED: 'Subcategoria activada',
  SUBCATEGORY_DEACTIVATED: 'Subcategoria desactivada',
  SLA_CREATED: 'SLA creado',
  SLA_UPDATED: 'SLA actualizado',
  SLA_DELETED: 'SLA eliminado',
  REPLACEMENT_REQUESTED: 'Reemplazo solicitado',
  REPLACEMENT_APPROVED_BY_ADMIN: 'Reemplazo aprobado por admin',
  REPLACEMENT_REJECTED: 'Reemplazo rechazado',
  REPLACEMENT_PRODUCT_REGISTERED: 'Producto de reemplazo registrado',
  REPLACEMENT_DELIVERED: 'Reemplazo entregado',
  REFUND_CREATED: 'Reembolso creado',
  SCHEDULED_REPORT_CREATED: 'Reporte programado creado',
  SCHEDULED_REPORT_DELETED: 'Reporte programado eliminado',
  SCHEDULED_REPORT_ACTIVATED: 'Reporte programado activado',
  SCHEDULED_REPORT_DEACTIVATED: 'Reporte programado desactivado',
  TICKET_ASSIGNMENT_MODE_UPDATED: 'Modo de asignacion actualizado'
};

export const entityLabel = {
  AppSettings: 'Configuracion',
  Appointment: 'Cita',
  AuditLog: 'Auditoria',
  Auth: 'Autenticacion',
  Category: 'Categoria',
  NotificationChannelsConfig: 'Canal de notificacion',
  NotificationFrequencyRule: 'Regla de frecuencia',
  NotificationTemplate: 'Plantilla de notificacion',
  Refund: 'Reembolso',
  Replacement: 'Reemplazo',
  Report: 'Reporte',
  ScheduledReport: 'Reporte programado',
  Sla: 'SLA',
  Subcategory: 'Subcategoria',
  Ticket: 'Ticket',
  TicketEvidence: 'Evidencia',
  User: 'Usuario',
  Warranty: 'Garantia'
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
