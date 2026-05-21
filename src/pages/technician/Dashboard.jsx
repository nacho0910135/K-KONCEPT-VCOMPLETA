import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, ListChecks } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { technicianTickets } from './technicianMockData.js';
import { PriorityBadge, SlaBadge, TechnicianStatusBadge } from './technicianUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { useAdminResource } from '../../hooks/useAdminResource.js';

const Dashboard = () => {
  const { data, isLoading } = useAdminResource(() => technicianTickets, []);
  const tickets = data || [];
  const criticalPending = tickets.filter((ticket) => ticket.priority === 'CRITICAL' && ticket.status !== 'RESOLVED').length;

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
        <StatCard title="Resueltos este mes" value={tickets.filter((ticket) => ticket.status === 'RESOLVED').length} icon={CheckCircle2} tone="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Ultimos 5 asignados</h2>
          <div className="mt-4 grid gap-3">
            {isLoading && Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-neutral-100" />)}
            {tickets.slice(0, 5).map((ticket) => (
              <Link key={ticket.id} to={`/technician/tickets/${ticket.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-3 hover:bg-neutral-50">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{ticket.code} - {ticket.title}</p>
                  <p className="text-xs text-neutral-500">{ticket.client.company} - {formatDate(ticket.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <TechnicianStatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-neutral-900">SLAs proximos a vencer</h2>
          <div className="mt-4 grid gap-3">
            {tickets.filter((ticket) => ticket.status !== 'RESOLVED').sort((a, b) => a.slaHoursLeft - b.slaHoursLeft).slice(0, 5).map((ticket) => (
              <Link key={ticket.id} to={`/technician/tickets/${ticket.id}`} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                <span className="text-sm font-semibold text-neutral-800">{ticket.code}</span>
                <SlaBadge hours={ticket.slaHoursLeft} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
