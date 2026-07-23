import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Award, CheckCircle2, Clock3, PackageCheck, RefreshCw, Star, TicketCheck, TicketPlus, WalletCards } from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { getKpiOverview, listAuditLogs } from '../../services/admin.client.service.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { eventLabel, priorityLabel } from './adminUtils.jsx';

const colors = ['#dc2626', '#f59e0b', '#2563eb', '#0f766e', '#64748b', '#8b5cf6'];
const statusLabel = {
  OPEN: 'Abiertos',
  ASSIGNED: 'Asignados',
  PENDING: 'Pendientes',
  IN_PROGRESS: 'En progreso',
  WAITING_CUSTOMER: 'Esperando cliente',
  RESOLVED: 'Resueltos',
  CLOSED: 'Cerrados',
  CANCELLED: 'Cancelados',
  REOPENED: 'Reabiertos'
};
const replacementLabel = {
  PENDING_APPROVAL: 'Por validar',
  APPROVED: 'Aprobados',
  IN_TRANSIT: 'En transito',
  DELIVERED: 'Entregados',
  REJECTED: 'Rechazados'
};
const getCount = (rows = [], key, field = 'status') => rows.find((item) => item[field] === key || item.name === key)?.count || rows.find((item) => item[field] === key || item.name === key)?.value || 0;
const pct = (value) => `${Number(value || 0).toFixed(0)}%`;
const money = (value) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value || 0);

const Dashboard = () => {
  const { data, isLoading, error } = useAdminResource(async () => {
    const [overview, audit] = await Promise.all([
      getKpiOverview(),
      listAuditLogs({ limit: 8 })
    ]);

    const statusRows = overview?.ticketsByStatus || [];
    const byPriority = (overview?.ticketsByPriority || []).map((item) => ({ name: priorityLabel[item.priority] || item.priority, value: item.count || 0 }));
    const byCategory = (overview?.ticketsByCategory || []).map((item) => ({ name: item.categoryName || 'Sin categoria', value: item.count || 0 }));
    const monthly = (overview?.monthlyVolume || []).map((item) => ({ name: item.month, tickets: item.count || 0 }));
    const technicians = [...(overview?.ticketsByTechnician || [])].filter((item) => item.technicianId).sort((a, b) => b.score - a.score);
    const service = overview?.serviceOperations || {};
    const active = ['OPEN', 'ASSIGNED', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'REOPENED'].reduce((sum, status) => sum + getCount(statusRows, status), 0);
    const completed = getCount(statusRows, 'RESOLVED') + getCount(statusRows, 'CLOSED');
    const waiting = getCount(statusRows, 'WAITING_CUSTOMER') + getCount(statusRows, 'PENDING');
    const health = Math.max(0, Math.min(100, Number(overview?.slaCompliance?.complianceRate || 0) - (overview?.reopenedRate?.reopenedRate || 0) - Math.min(waiting * 3, 20)));

    return {
      overview,
      auditLogs: audit.data?.items || audit.data || [],
      statusCards: [
        { title: 'Activos', value: active, icon: TicketPlus, tone: active > 10 ? 'warning' : 'primary' },
        { title: 'En espera', value: waiting, icon: Clock3, tone: waiting > 0 ? 'warning' : 'neutral' },
        { title: 'Completados', value: completed, icon: TicketCheck, tone: 'success' },
        { title: 'SLA cumplido', value: pct(overview?.slaCompliance?.complianceRate), helper: `${overview?.slaCompliance?.breached || 0} vencidos`, icon: CheckCircle2, tone: 'success' },
        { title: 'Tiempo respuesta', value: `${overview?.avgResponseTime?.averageHours || 0} h`, icon: RefreshCw, tone: 'primary' },
        { title: 'Tiempo resolucion', value: `${overview?.avgResolutionTime?.averageHours || 0} h`, icon: Clock3, tone: 'warning' },
        { title: 'Calificacion', value: overview?.ratingSummary?.average || 0, helper: `${overview?.ratingSummary?.count || 0} opiniones`, icon: Star, tone: 'warning' },
        { title: 'Reabiertos', value: pct(overview?.reopenedRate?.reopenedRate), icon: AlertTriangle, tone: (overview?.reopenedRate?.reopenedRate || 0) > 10 ? 'danger' : 'neutral' }
      ],
      health,
      byStatus: statusRows.map((item) => ({ name: statusLabel[item.status] || item.status, value: item.count || 0 })),
      byPriority,
      byCategory,
      monthly,
      technicians,
      topTechnicians: technicians.slice(0, 3),
      operations: [
        { label: 'Reemplazos abiertos', value: (service.replacementsByStatus || []).filter((item) => item.status !== 'DELIVERED' && item.status !== 'REJECTED').reduce((sum, item) => sum + item.count, 0), icon: PackageCheck },
        { label: 'Reemplazos entregados', value: getCount(service.replacementsByStatus, 'DELIVERED'), icon: CheckCircle2 },
        { label: 'Reembolsos registrados', value: service.refundCount || 0, icon: WalletCards },
        { label: 'Monto reembolsado', value: money(service.refundAmount), icon: WalletCards }
      ],
      replacements: (service.replacementsByStatus || []).map((item) => ({ name: replacementLabel[item.status] || item.status, value: item.count }))
    };
  }, []);

  const healthTone = data?.health >= 85 ? 'success' : data?.health >= 65 ? 'warning' : 'danger';
  const employee = data?.topTechnicians?.[0];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Salud operativa</h1>
          <p className="mt-1 text-sm text-neutral-500">Vista ejecutiva de tickets, SLA, tecnicos, reembolsos y reemplazos.</p>
        </div>
        <Badge tone={healthTone}>Salud general {pct(data?.health)}</Badge>
      </div>
      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.statusCards || []).map((card) => <StatCard key={card.title} {...card} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-neutral-900">Tendencia mensual</h2>
              <p className="text-sm text-neutral-500">Volumen de casos creados</p>
            </div>
            <Badge tone={healthTone}>{data?.health >= 85 ? 'Estable' : data?.health >= 65 ? 'Vigilar' : 'Critico'}</Badge>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthly || []}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="tickets" name="Tickets" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-neutral-900">Empleado del mes</h2>
          {employee ? (
            <div className="mt-5 rounded-lg bg-primary-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-600 text-white"><Award className="h-6 w-6" /></span>
                <div>
                  <p className="font-bold text-neutral-900">{employee.technicianName}</p>
                  <p className="text-sm text-neutral-500">{employee.resolved} resueltos, {employee.open} abiertos</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md bg-white p-2"><p className="font-bold">{pct(employee.resolutionRate)}</p><p className="text-neutral-500">Resolucion</p></div>
                <div className="rounded-md bg-white p-2"><p className="font-bold">{employee.ratingAverage || 0}</p><p className="text-neutral-500">Rating</p></div>
                <div className="rounded-md bg-white p-2"><p className="font-bold">{employee.breached}</p><p className="text-neutral-500">SLA venc.</p></div>
              </div>
            </div>
          ) : <p className="mt-4 text-sm text-neutral-500">Aun no hay datos de tecnicos.</p>}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold text-neutral-900">Estados de casos</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.byStatus || []} dataKey="value" nameKey="name" outerRadius={92} label={({ name, value }) => `${name}: ${value}`}>
                  {(data?.byStatus || []).map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-neutral-900">Prioridad</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byPriority || []}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Tickets" radius={[6, 6, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-neutral-900">Reemplazos</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.replacements || []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} label={({ name, value }) => `${name}: ${value}`}>
                  {(data?.replacements || []).map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="font-semibold text-neutral-900">Operacion financiera y logistica</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(data?.operations || []).map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-neutral-200 p-4">
                <Icon className="h-5 w-5 text-primary-700" />
                <p className="mt-3 text-2xl font-bold text-neutral-900">{value}</p>
                <p className="text-sm text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-neutral-900">Top 3 tecnicos</h2>
          <DataTable
            searchable={false}
            pageSize={3}
            loading={isLoading}
            data={data?.topTechnicians || []}
            columns={[
              { key: 'technicianName', header: 'Tecnico' },
              { key: 'resolved', header: 'Resueltos' },
              { key: 'open', header: 'Abiertos' },
              { key: 'resolutionRate', header: 'Resolucion', render: (row) => pct(row.resolutionRate) },
              { key: 'ratingAverage', header: 'Rating', render: (row) => row.ratingAverage || 0 }
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="font-semibold text-neutral-900">Categorias con mas demanda</h2>
          <div className="mt-4 space-y-3">
            {(data?.byCategory || []).sort((a, b) => b.value - a.value).slice(0, 5).map((item, index) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><span className="font-semibold">{item.value}</span></div>
                <div className="h-2 rounded-full bg-neutral-100"><div className="h-2 rounded-full bg-primary-600" style={{ width: `${Math.min(100, (item.value / Math.max(...(data?.byCategory || [{ value: 1 }]).map((row) => row.value))) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-neutral-900">Actividad reciente</h2>
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
