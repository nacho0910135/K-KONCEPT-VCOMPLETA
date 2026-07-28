import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import { priorityLabels, PriorityBadge, TechnicianStatusBadge, technicianStatusLabels } from './technicianUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { getAssignedTickets } from '../../services/tickets.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const tabs = {
  attention: { label: 'Pendientes', statuses: ['OPEN', 'IN_PROGRESS', 'REOPENED'] },
  waiting: { label: 'En espera', statuses: ['WAITING_CUSTOMER', 'PENDING'] },
  completed: { label: 'Completados', statuses: ['RESOLVED', 'CLOSED', 'CANCELLED'] }
};
const isDueToday = (ticket) => {
  if (!ticket.slaDeadline) return false;
  const deadline = new Date(ticket.slaDeadline);
  const today = new Date();
  return deadline.toDateString() === today.toDateString();
};
const slaWeight = (ticket) => {
  if (!ticket.slaDeadline) return 0;
  const hours = (new Date(ticket.slaDeadline) - new Date()) / 36e5;
  if (hours < 0) return 3;
  if (hours <= 4) return 2;
  if (hours <= 24) return 1;
  return 0;
};
const matchesSearch = (ticket, query) => JSON.stringify(ticket).toLowerCase().includes(query.trim().toLowerCase());
const ticketTab = (ticket) => Object.entries(tabs).find(([, tab]) => tab.statuses.includes(ticket.status))?.[0];

const TicketsAsignados = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('attention');
  const [filters, setFilters] = useState({ priority: '' });
  const [sortMode, setSortMode] = useState('priority');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getAssignedTickets({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
        if (mounted) setTickets(response.data || []);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'No pudimos cargar tus tickets asignados.'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const normalized = searchTerm.trim();
    if (!normalized || tickets.some((ticket) => tabs[activeTab].statuses.includes(ticket.status) && matchesSearch(ticket, normalized))) return;

    const match = tickets.find((ticket) => matchesSearch(ticket, normalized));
    const nextTab = match && ticketTab(match);
    if (nextTab) setActiveTab(nextTab);
  }, [activeTab, searchTerm, tickets]);

  const rows = useMemo(() => {
    const filtered = tickets.filter((ticket) => (
      (!filters.priority || ticket.priority === filters.priority)
      && tabs[activeTab].statuses.includes(ticket.status)
    ));

    return [...filtered].sort((a, b) => {
      if (sortMode === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      return priorityWeight[b.priority] - priorityWeight[a.priority]
        || slaWeight(b) - slaWeight(a)
        || Number(b.status === 'REOPENED') - Number(a.status === 'REOPENED')
        || new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
  }, [tickets, filters, sortMode, activeTab]);

  const counts = useMemo(() => Object.fromEntries(Object.entries(tabs).map(([key, tab]) => [
    key,
    tickets.filter((ticket) => tab.statuses.includes(ticket.status)).length
  ])), [tickets]);
  const kpis = useMemo(() => ({
    answer: counts.attention || 0,
    waiting: counts.waiting || 0,
    dueToday: tickets.filter((ticket) => tabs.attention.statuses.includes(ticket.status) && isDueToday(ticket)).length
  }), [counts, tickets]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Bandeja asignada</h1>
        <p className="mt-1 text-sm text-neutral-500">Casos activos primero, historial fuera del camino.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-neutral-500">Tengo que responder</p>
          <p className="mt-1 text-2xl font-bold text-danger">{kpis.answer}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-neutral-500">Esperando cliente</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{kpis.waiting}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-neutral-500">Vencen hoy SLA</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{kpis.dueToday}</p>
        </Card>
      </div>

      <Card className="flex flex-wrap gap-2 p-2">
        {Object.entries(tabs).map(([key, tab]) => (
          <button
            key={key}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === key ? 'bg-primary-600 text-white shadow-soft' : 'text-neutral-600 hover:bg-neutral-100'}`}
            type="button"
            onClick={() => setActiveTab(key)}
          >
            {tab.label} ({counts[key] || 0})
          </button>
        ))}
      </Card>

      <Card className="grid gap-3 p-4 md:grid-cols-2">
        <select className={`rounded-md border px-3 py-2 text-sm ${filters.priority === 'CRITICAL' || filters.priority === 'HIGH' ? 'border-danger bg-red-50 text-danger' : 'border-neutral-200'}`} value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
          <option value="">Todas las prioridades</option>
          {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
          <option value="priority">Orden inteligente</option>
          <option value="date">Ordenar por fecha</option>
        </select>
      </Card>

      <DataTable
        data={rows}
        loading={isLoading}
        error={error}
        searchPlaceholder="Buscar por codigo o cliente"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        emptyTitle="No se encontraron tickets"
        emptyDescription="No hay casos asignados que coincidan con la busqueda o filtros activos."
        columns={[
          { key: 'priority', header: 'Prioridad', render: (row) => <PriorityBadge priority={row.priority} /> },
          { key: 'code', header: 'Codigo', sortable: true },
          { key: 'title', header: 'Titulo', render: (row) => <span className="inline-flex items-center gap-2">{['OPEN', 'REOPENED'].includes(row.status) && <span className="h-2 w-2 rounded-full bg-danger" />} {row.title} {row.appealedAt && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Apelacion</span>}</span>, sortable: true },
          { key: 'client', header: 'Cliente', render: (row) => row.client?.company || row.client?.name || 'Cliente', sortable: true },
          { key: 'status', header: 'Estado', render: (row) => <TechnicianStatusBadge status={row.status} /> },
          { key: 'createdAt', header: 'Fecha', render: (row) => formatDate(row.createdAt), sortable: true },
          { key: 'actions', header: 'Acciones', render: (row) => <Link to={`/technician/tickets/${row.id}`}><Button variant="ghost"><Eye className="h-4 w-4" />Abrir</Button></Link> }
        ]}
      />
    </div>
  );
};

export default TicketsAsignados;
