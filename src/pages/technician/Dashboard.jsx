import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, ListChecks } from 'lucide-react';
import { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import IllustratedEmptyState from '../../components/common/IllustratedEmptyState.jsx';
import { PriorityBadge, TechnicianStatusBadge } from './technicianUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { getAssignedTickets } from '../../services/tickets.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const criticalPending = tickets.filter((ticket) => ticket.priority === 'CRITICAL' && ticket.status !== 'RESOLVED').length;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getAssignedTickets({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
        if (mounted) setTickets(response.data || []);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'No pudimos cargar el panel tecnico.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Panel tecnico</h1>
        <p className="mt-1 text-sm text-neutral-500">Prioriza casos, SLA y resoluciones del mes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Mis tickets asignados" value={tickets.length} icon={ListChecks} />
        <StatCard title="En progreso" value={tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length} icon={Clock3} tone="warning" />
        <StatCard title="Criticos pendientes" value={criticalPending} icon={AlertTriangle} tone="danger" />
        <StatCard title="Resueltos este mes" value={tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length} icon={CheckCircle2} tone="success" />
      </div>

      {error && <Card className="border-danger bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</Card>}

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Ultimos 5 asignados</h2>
        <div className="mt-4 grid gap-3">
          {isLoading && Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-neutral-100" />)}
          {!isLoading && tickets.length === 0 && <IllustratedEmptyState title="Sin tickets asignados" description="Cuando se te asignen casos apareceran aqui." />}
          {tickets.slice(0, 5).map((ticket) => (
            <Link key={ticket.id} to={`/technician/tickets/${ticket.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-3 hover:bg-neutral-50">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{ticket.code} - {ticket.title}</p>
                <p className="text-xs text-neutral-500">{ticket.client?.company || ticket.client?.name || 'Cliente'} - {formatDate(ticket.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority={ticket.priority} />
                <TechnicianStatusBadge status={ticket.status} />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
