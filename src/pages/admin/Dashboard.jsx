import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock3, FolderKanban, Star, TicketCheck, TicketPlus } from 'lucide-react';
import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import DateRangePicker from '../../components/forms/DateRangePicker.jsx';
import { auditLogs, categories, dashboard, priorities, technicians } from './adminMockData.js';
import { optionize } from './adminUtils.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { formatDateTime } from '../../utils/formatDate.js';

const colors = ['#2563eb', '#0f766e', '#d97706', '#dc2626'];

const Dashboard = () => {
  const [filters, setFilters] = useState({ dateRange: { from: '2026-05-01', to: '2026-05-21' }, category: '', priority: '' });
  const { data, isLoading, error } = useAdminResource(() => ({ dashboard, technicians, auditLogs }), []);

  const summary = data?.dashboard.summary || {};

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard administrativo</h1>
          <p className="mt-1 text-sm text-neutral-500">KPIs operativos, SLA y actividad reciente.</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <DateRangePicker value={filters.dateRange} onChange={(dateRange) => setFilters({ ...filters, dateRange })} />
          <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
            Categoria
            <select className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              <option value="">Todas</option>
              {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-neutral-700 lg:col-start-3">
            Prioridad
            <select className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
              <option value="">Todas</option>
              {optionize(priorities).map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
            </select>
          </label>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tickets abiertos" value={summary.open ?? '...'} icon={TicketPlus} />
        <StatCard title="En progreso" value={summary.inProgress ?? '...'} icon={Clock3} tone="warning" />
        <StatCard title="Pendientes" value={summary.pending ?? '...'} icon={FolderKanban} tone="neutral" />
        <StatCard title="Resueltos" value={summary.resolved ?? '...'} icon={TicketCheck} tone="success" />
        <StatCard title="Cerrados" value={summary.closed ?? '...'} icon={CheckCircle2} tone="neutral" />
        <StatCard title="SLA cumplido" value={`${summary.slaMet ?? '...'}%`} helper="Sobre tickets cerrados" icon={CheckCircle2} tone="success" />
        <StatCard title="Calificacion promedio" value={summary.rating ?? '...'} helper="Ultimos 30 dias" icon={Star} tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-1">
          <h2 className="text-sm font-semibold text-neutral-900">Tickets por prioridad</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dashboard.byPriority || []}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 xl:col-span-2">
          <h2 className="text-sm font-semibold text-neutral-900">Volumen mensual</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.dashboard.monthly || []}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="tickets" stroke="#0f766e" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Distribucion por categoria</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.dashboard.categoryDistribution || []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92}>
                  {(data?.dashboard.categoryDistribution || []).map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Top tecnicos por resoluciones</h2>
          <DataTable
            searchable={false}
            pageSize={5}
            loading={isLoading}
            error={error}
            data={data?.technicians || []}
            columns={[
              { key: 'name', header: 'Tecnico', sortable: true },
              { key: 'resolutions', header: 'Resoluciones', sortable: true },
              { key: 'rating', header: 'Rating', sortable: true }
            ]}
          />
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Actividad reciente</h2>
        <div className="grid gap-3">
          {(data?.auditLogs || []).slice(0, 10).map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-100 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{log.action}</p>
                <p className="text-xs text-neutral-500">{log.user} sobre {log.entity} {log.entityId}</p>
              </div>
              <time className="text-xs text-neutral-500">{formatDateTime(log.createdAt)}</time>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
