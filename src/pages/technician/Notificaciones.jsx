import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import IllustratedEmptyState from '../../components/common/IllustratedEmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { formatRelativeDate } from '../../utils/formatDate.js';
import { useToast } from '../../hooks/useToast.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../../services/notifications.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { cleanNotificationText } from '../../utils/notificationText.js';

const Notificaciones = () => {
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const { showToast } = useToast();
  const { notifications, refreshNotifications } = useNotifications();

  const markAll = async () => {
    try {
      await markAllNotificationsAsRead();
      await refreshNotifications();
      showToast({ type: 'success', title: 'Notificaciones marcadas como leidas' });
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

  const pageItems = useMemo(() => notifications.slice((page - 1) * pageSize, page * pageSize), [notifications, page]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notificaciones</h1>
          <p className="mt-1 text-sm text-neutral-500">Asignaciones, comentarios y alertas reales.</p>
        </div>
        <Button variant="ghost" onClick={markAll}>Marcar todas como leidas</Button>
      </div>
      {notifications.length === 0 ? <IllustratedEmptyState title="Sin notificaciones" description="Aqui apareceran nuevas asignaciones y comentarios." /> : (
        <Card className="p-2">
          <div className="grid divide-y divide-neutral-100">
            {pageItems.map((item) => (
              <Link key={item.id} to={item.entityId ? `/technician/tickets/${item.entityId}` : '/technician/notifications'} onClick={() => markRead(item.id)} className="grid gap-1 rounded-md px-3 py-3 hover:bg-neutral-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.read ? 'bg-neutral-100 text-neutral-500' : 'bg-primary-50 text-primary-700'}`}>{item.read ? 'Leida' : 'Nueva'}</span>
                </div>
                <p className="text-sm leading-6 text-neutral-600">{cleanNotificationText(item.message)}</p>
                <p className="text-xs text-neutral-500">{formatRelativeDate(item.createdAt)}</p>
              </Link>
            ))}
          </div>
          <div className="p-3"><Pagination page={page} pageSize={pageSize} total={notifications.length} onPageChange={setPage} /></div>
        </Card>
      )}
    </div>
  );
};

export default Notificaciones;
