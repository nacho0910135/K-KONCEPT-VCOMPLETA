import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return 'Sin fecha';
  return format(new Date(date), 'dd MMM yyyy', { locale: es });
};

export const formatDateTime = (date) => {
  if (!date) return 'Sin fecha';
  return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: es });
};

export const formatRelativeDate = (date) => {
  if (!date) return 'Sin fecha';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
};
