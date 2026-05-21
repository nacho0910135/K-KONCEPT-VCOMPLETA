import { Link } from 'react-router-dom';
import { useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import IllustratedEmptyState from '../../components/common/IllustratedEmptyState.jsx';
import { technicianNotifications } from './technicianMockData.js';
import { formatRelativeDate } from '../../utils/formatDate.js';
import { useToast } from '../../hooks/useToast.js';

const Notificaciones = () => {
  const [notifications, setNotifications] = useState(technicianNotifications);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const { showToast } = useToast();

  const markRead = (id) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  const markAll = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    showToast({ type: 'success', title: 'Notificaciones marcadas como leidas' });
  };

  const pageItems = notifications.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notificaciones</h1>
          <p className="mt-1 text-sm text-neutral-500">Asignaciones, comentarios y cambios de estado.</p>
        </div>
        <Button variant="ghost" onClick={markAll}>Marcar todo como leido</Button>
      </div>
      {notifications.length === 0 ? <IllustratedEmptyState title="Sin notificaciones" description="Aqui apareceran nuevas asignaciones y comentarios." /> : (
        <Card className="p-2">
          <div className="grid divide-y divide-neutral-100">
            {pageItems.map((item) => (
              <Link key={item.id} to={`/technician/tickets/${item.ticketId}`} onClick={() => markRead(item.id)} className="grid gap-1 rounded-md px-3 py-3 hover:bg-neutral-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.read ? 'bg-neutral-100 text-neutral-500' : 'bg-primary-50 text-primary-700'}`}>{item.read ? 'Leida' : 'Nueva'}</span>
                </div>
                <p className="text-sm text-neutral-600">{item.message}</p>
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
