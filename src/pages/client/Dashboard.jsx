import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, Clock3, PlusCircle, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import IllustratedEmptyState from '../../components/common/IllustratedEmptyState.jsx';
import { ClientStatusBadge } from './clientUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { getMyTickets } from '../../services/tickets.service.js';
import { getLatestNotifications } from '../../services/notifications.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [ticketsResponse, notificationResponse] = await Promise.all([
          getMyTickets({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          getLatestNotifications({ limit: 5 })
        ]);
        const notificationData = notificationResponse?.data ?? notificationResponse;
        if (mounted) {
          setTickets(ticketsResponse.data || []);
          setNotifications(Array.isArray(notificationData) ? notificationData : notificationData?.items || notificationData?.notifications || []);
        }
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'No pudimos cargar tu resumen.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const unread = notifications.filter((item) => !item.read);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Inicio</h1>
          <p className="mt-1 text-sm text-neutral-500">Resumen de tus solicitudes y notificaciones.</p>
        </div>
        <Link to="/client/tickets/new"><Button><PlusCircle className="h-4 w-4" />Crear nuevo ticket</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Tickets abiertos" value={tickets.filter((ticket) => ticket.status === 'OPEN').length} icon={Ticket} tone="success" />
        <StatCard title="En proceso" value={tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length} icon={Clock3} />
        <StatCard title="Resueltos" value={tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length} icon={CheckCircle2} tone="success" />
      </div>

      {error && <Card className="border-danger bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</Card>}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_.8fr]">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Ultimos 5 tickets</h2>
          <div className="mt-4 grid gap-3">
            {isLoading && Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-neutral-100" />)}
            {tickets.slice(0, 5).map((ticket) => (
              <Link key={ticket.id} to={`/client/tickets/${ticket.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-3 transition hover:border-primary-200 hover:bg-primary-50">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{ticket.code} · {ticket.title}</p>
                  <p className="text-xs text-neutral-500">{formatDate(ticket.createdAt)}</p>
                </div>
                <ClientStatusBadge status={ticket.status} />
              </Link>
            ))}
            {!isLoading && tickets.length === 0 && <IllustratedEmptyState title="Sin tickets" description="Tus solicitudes apareceran aqui cuando las registres." />}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Notificaciones no leidas</h2>
            <Bell className="h-5 w-5 text-primary-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-neutral-900">{unread.length}</p>
          <div className="mt-4 grid gap-2">
            {unread.map((item) => (
              <Link key={item.id} to={item.entityId ? `/client/tickets/${item.entityId}` : '/client/notifications'} className="rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50">{item.title}</Link>
            ))}
            {!isLoading && unread.length === 0 && <p className="text-sm text-neutral-500">No tienes notificaciones pendientes.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
