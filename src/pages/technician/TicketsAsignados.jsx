import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import { technicianTickets, priorityWeight } from './technicianMockData.js';
import { priorityLabels, PriorityBadge, SlaBadge, TechnicianStatusBadge, technicianStatusLabels } from './technicianUtils.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { useAdminResource } from '../../hooks/useAdminResource.js';

const TicketsAsignados = () => {
  const { data, isLoading, error } = useAdminResource(() => technicianTickets, []);
  const [filters, setFilters] = useState({ priority: '', status: '' });
  const [sortMode, setSortMode] = useState('priority');

  const rows = useMemo(() => {
    const filtered = (data || []).filter((ticket) => (
      (!filters.priority || ticket.priority === filters.priority)
      && (!filters.status || ticket.status === filters.status)
    ));

    return [...filtered].sort((a, b) => {
      if (sortMode === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      return priorityWeight[b.priority] - priorityWeight[a.priority] || new Date(a.createdAt) - new Date(b.createdAt);
    });
  }, [data, filters, sortMode]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Bandeja asignada</h1>
        <p className="mt-1 text-sm text-neutral-500">Busca por codigo o cliente, filtra por prioridad y estado.</p>
      </div>

      <Card className="grid gap-3 p-4 md:grid-cols-3">
        <select className={`rounded-md border px-3 py-2 text-sm ${filters.priority === 'CRITICAL' || filters.priority === 'HIGH' ? 'border-danger bg-red-50 text-danger' : 'border-neutral-200'}`} value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
          <option value="">Todas las prioridades</option>
          {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">Todos los estados</option>
          {Object.entries(technicianStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
          <option value="priority">Ordenar por prioridad</option>
          <option value="date">Ordenar por fecha</option>
        </select>
      </Card>

      <DataTable
        data={rows}
        loading={isLoading}
        error={error}
        searchPlaceholder="Buscar por code o cliente"
        emptyTitle="No se encontraron tickets"
        emptyDescription="No hay casos asignados que coincidan con la busqueda o filtros activos."
        columns={[
          { key: 'code', header: 'Code', sortable: true },
          { key: 'title', header: 'Titulo', sortable: true },
          { key: 'client', header: 'Cliente', render: (row) => row.client.company, sortable: true },
          { key: 'priority', header: 'Prioridad', render: (row) => <PriorityBadge priority={row.priority} /> },
          { key: 'status', header: 'Estado', render: (row) => <TechnicianStatusBadge status={row.status} /> },
          { key: 'createdAt', header: 'Fecha', render: (row) => formatDate(row.createdAt), sortable: true },
          { key: 'slaHoursLeft', header: 'SLA restante', render: (row) => <SlaBadge hours={row.slaHoursLeft} /> },
          { key: 'actions', header: 'Acciones', render: (row) => <Link to={`/technician/tickets/${row.id}`}><Button variant="ghost"><Eye className="h-4 w-4" />Abrir</Button></Link> }
        ]}
      />
    </div>
  );
};

export default TicketsAsignados;
