import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock3, FolderKanban, Star, TicketCheck, TicketPlus } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { getKpiOverview, getMonthlyVolume, getTicketsByCategory, getTicketsByPriority, listAuditLogs } from '../../services/admin.client.service.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { eventLabel, priorityLabel } from './adminUtils.jsx';

const colors = ['#2563eb', '#0f766e', '#d97706', '#dc2626'];
const getCount = (rows = [], status) => rows.find((item) => item.status === status || item.name === status)?.count || rows.find((item) => item.status === status || item.name === status)?.value || 0;

const Dashboard = () => {
  const { data, isLoading, error } = useAdminResource(async () => {
    const [overview, byPriority, byCategory, monthly, audit] = await Promise.all([
      getKpiOverview(),
      getTicketsByPriority(),
      getTicketsByCategory(),
      getMonthlyVolume(),
      listAuditLogs({ limit: 10 })
    ]);

    return {
      overview: overview || {},
      byPriority: (byPriority || overview?.ticketsByPriority || []).map((item) => ({ name: priorityLabel[item.priority] || item.priority || item.name, value: item.count || item.value || 0 })),
      byCategory: (byCategory || overview?.ticketsByCategory || []).map((item) => ({ name: item.category?.name || item.categoryName || item.name || item.category || 'Sin categoria', value: item.count || item.value || 0 })),
      monthly: (monthly || overview?.monthlyVolume || []).map((item) => ({ name: item.month || item.name, tickets: item.count || item.tickets || 0 })),
      auditLogs: audit.data?.items || audit.data || []
    };
  }, []);

  const overview = data?.overview || {};
  const statusRows = overview.ticketsByStatus || [];
  const slaRate = overview.slaCompliance?.complianceRate ?? overview.slaCompliance ?? 0;
  const rating = overview.ratingSummary?.average ?? overview.ratingSummary ?? 0;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Panel administrativo</h1>
        <p className="mt-1 text-sm text-neutral-500">KPIs operativos, SLA y actividad reciente desde la base real.</p>
      </div>
      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tickets abiertos" value={getCount(statusRows, 'OPEN')} icon={TicketPlus} />
        <StatCard title="En progreso" value={getCount(statusRows, 'IN_PROGRESS')} icon={Clock3} tone="warning" />
        <StatCard title="Pendientes" value={getCount(statusRows, 'PENDING')} icon={FolderKanban} tone="neutral" />
        <StatCard title="Resueltos" value={getCount(statusRows, 'RESOLVED')} icon={TicketCheck} tone="success" />
        <StatCard title="Cerrados" value={getCount(statusRows, 'CLOSED')} icon={CheckCircle2} tone="neutral" />
        <StatCard title="SLA cumplido" value={`${slaRate}%`} helper="Sobre tickets medidos" icon={CheckCircle2} tone="success" />
        <StatCard title="Calificacion promedio" value={rating} helper="Datos reales disponibles" icon={Star} tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Tickets por prioridad</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byPriority || []}>
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
              <LineChart data={data?.monthly || []}>
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
                <Pie data={data?.byCategory || []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92}>
                  {(data?.byCategory || []).map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Actividad reciente</h2>
          <DataTable
            searchable={false}
            pageSize={5}
            loading={isLoading}
            data={data?.auditLogs || []}
            columns={[
              { key: 'createdAt', header: 'Fecha', render: (row) => formatDateTime(row.createdAt) },
              { key: 'action', header: 'Accion', render: (row) => eventLabel[row.action] || row.action },
              { key: 'entity', header: 'Entidad' },
              { key: 'user', header: 'Usuario', render: (row) => row.user?.email || row.user?.name || 'Sistema' }
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
