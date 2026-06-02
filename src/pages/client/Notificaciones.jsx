import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, MessageSquare, Ticket } from 'lucide-react';
import { useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import IllustratedEmptyState from '../../components/common/IllustratedEmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { formatRelativeDate } from '../../utils/formatDate.js';
import { useToast } from '../../hooks/useToast.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { clearNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../../services/notifications.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { cleanNotificationText } from '../../utils/notificationText.js';
import { useAuth } from '../../hooks/useAuth.js';

const getIcon = (event) => {
  if (event === 'TICKET_CREATED' || event === 'TICKET_ASSIGNED') return Ticket;
  if (event === 'NEW_COMMENT') return MessageSquare;
  if (event === 'TICKET_RESOLVED' || event === 'TICKET_CLOSED') return CheckCircle2;
  return Bell;
};

const getMessage = (message) => {
  const cleaned = cleanNotificationText(message);
  return cleaned.length > 180 ? `${cleaned.slice(0, 180).trim()}...` : cleaned;
};

const Notificaciones = () => {
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const { showToast } = useToast();
  const { user } = useAuth();
  const { notifications, refreshNotifications } = useNotifications();
  const ticketBasePath = user?.role === 'ADMIN'
    ? '/admin/tickets'
    : user?.role === 'TECHNICIAN'
      ? '/technician/tickets'
      : '/client/tickets';
  const fallbackPath = user?.role === 'ADMIN'
    ? '/admin/notificaciones'
    : user?.role === 'TECHNICIAN'
      ? '/technician/notifications'
      : '/client/notifications';

  const markAll = async () => {
    try {
      await markAllNotificationsAsRead();
      await refreshNotifications();
      showToast({ type: 'success', title: 'Notificaciones leidas' });
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudieron marcar', message: getErrorMessage(error) });
    }
  };

  const markRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await refreshNotifications();
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudo marcar', message: getErrorMessage(error) });
    }
  };

  const clearAll = async () => {
    try {
      await clearNotifications();
      await refreshNotifications();
      setPage(1);
      showToast({ type: 'success', title: 'Notificaciones limpiadas' });
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudieron limpiar', message: getErrorMessage(error) });
    }
  };

  const pageItems = useMemo(() => notifications.slice((page - 1) * pageSize, page * pageSize), [notifications, page]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notificaciones</h1>
          <p className="mt-1 text-sm text-neutral-500">Actualizaciones de tus tickets y servicios.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={markAll} disabled={notifications.length === 0}>Marcar todas como leidas</Button>
          <Button variant="danger" onClick={clearAll} disabled={notifications.length === 0}>Limpiar notificaciones</Button>
        </div>
      </div>
      {notifications.length === 0 ? <IllustratedEmptyState title="Sin notificaciones" description="Cuando haya novedades apareceran aqui." /> : (
        <div className="grid gap-3">
          {pageItems.map((item) => {
            const Icon = getIcon(item.event);
            const target = item.entityId ? `${ticketBasePath}/${item.entityId}` : fallbackPath;
            return (
              <Link key={item.id} to={target} onClick={() => markRead(item.id)} className="block">
                <Card className={`p-4 transition hover:border-primary-200 hover:shadow-sm ${item.read ? 'bg-white' : 'border-primary-100 bg-primary-50/40'}`}>
                  <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-start">
                    <span className={`grid h-10 w-10 place-items-center rounded-full ${item.read ? 'bg-neutral-100 text-neutral-500' : 'bg-primary-600 text-white'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-neutral-900">{item.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.read ? 'bg-neutral-100 text-neutral-500' : 'bg-red-50 text-red-700'}`}>{item.read ? 'Leida' : 'Nueva'}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">{getMessage(item.message)}</p>
                      <p className="mt-2 text-xs font-medium text-neutral-500">{formatRelativeDate(item.createdAt)}</p>
                    </div>
                    {item.entityId && <span className="text-sm font-semibold text-primary-700">Ver ticket</span>}
                  </div>
                </Card>
              </Link>
            );
          })}
          <Card className="p-3"><Pagination page={page} pageSize={pageSize} total={notifications.length} onPageChange={setPage} /></Card>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
