import { zodResolver } from '@hookform/resolvers/zod';
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Award, CheckCircle2, Clock3, Download, Edit, PackageCheck, Plus, Star, TicketCheck, TicketPlus, Trash2, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import EmailChipInput from '../../components/forms/EmailChipInput.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { createScheduledReport, deleteScheduledReport, exportReport, getKpiOverview, listScheduledReports, toggleScheduledReport, updateScheduledReport } from '../../services/admin.client.service.js';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { frequencyLabel, priorityLabel, reportTypeLabel } from './adminUtils.jsx';

const scheduledSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  reportType: z.enum(['TICKETS', 'KPI_OVERVIEW', 'AUDIT', 'SLA']),
  parameters: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  recipients: z.array(z.string().email()).min(1, 'Agrega al menos un destinatario'),
  format: z.enum(['CSV', 'EXCEL', 'PDF'])
});

const reportTypes = [
  { value: 'KPI_OVERVIEW', label: reportTypeLabel.KPI_OVERVIEW || 'KPI Overview' },
  { value: 'TICKETS', label: reportTypeLabel.TICKETS || 'Tickets' },
  { value: 'SLA', label: reportTypeLabel.SLA || 'SLA' },
  { value: 'AUDIT', label: reportTypeLabel.AUDIT || 'Auditoria' }
];

const parseParameters = (value) => {
  if (!value?.trim()) return {};
  return JSON.parse(value);
};

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const getCount = (rows = [], status) => rows.find((item) => item.status === status)?.count || 0;
const colors = ['#dc2626', '#f59e0b', '#2563eb', '#0f766e', '#64748b', '#8b5cf6'];
const statusLabel = { OPEN: 'Abiertos', ASSIGNED: 'Asignados', PENDING: 'Pendientes', IN_PROGRESS: 'En progreso', WAITING_CUSTOMER: 'Esperando cliente', RESOLVED: 'Resueltos', CLOSED: 'Cerrados', CANCELLED: 'Cancelados', REOPENED: 'Reabiertos' };
const replacementLabel = { PENDING_APPROVAL: 'Por validar', APPROVED: 'Aprobados', IN_TRANSIT: 'En transito', DELIVERED: 'Entregados', REJECTED: 'Rechazados' };
const pct = (value) => `${Number(value || 0).toFixed(0)}%`;
const money = (value) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value || 0);
const downloadFile = (response, fallback) => {
  const disposition = response.headers['content-disposition'] || '';
  const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] || fallback;
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

const Reportes = () => {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filters, setFilters] = useState({ dateFrom: monthStart, dateTo: today });
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();
  const { data, setData, isLoading, error } = useAdminResource(async () => {
    const [overview, scheduled] = await Promise.all([
      getKpiOverview(filters),
      listScheduledReports({ limit: 100 })
    ]);
    return {
      overview: overview || {},
      scheduled: scheduled.data?.items || scheduled.data || []
    };
  }, [filters.dateFrom, filters.dateTo]);
  const form = useForm({ resolver: zodResolver(scheduledSchema), defaultValues: { name: '', reportType: 'KPI_OVERVIEW', parameters: '', frequency: 'WEEKLY', recipients: [], format: 'PDF' } });
  const filterForm = useForm({ defaultValues: filters });
  const exportForm = useForm({ defaultValues: { reportType: 'KPI_OVERVIEW', format: 'PDF', dateFrom: monthStart, dateTo: today } });

  const openScheduled = (row = null) => {
    setEditing(row || { mode: 'new' });
    form.reset(row
      ? { name: row.name, reportType: row.reportType, parameters: JSON.stringify(row.parameters || {}, null, 2), frequency: row.frequency, recipients: row.recipients || [], format: row.format }
      : { name: '', reportType: 'KPI_OVERVIEW', parameters: '', frequency: 'WEEKLY', recipients: [], format: 'PDF' });
  };

  const saveScheduled = async (values) => {
    let parameters = {};
    try {
      parameters = parseParameters(values.parameters);
    } catch {
      showToast({ type: 'error', title: 'Parametros invalidos', message: 'Usa JSON valido o deja el campo vacio.' });
      return;
    }

    const payload = { ...values, parameters };
    if (editing?.id) {
      const updated = await updateScheduledReport(editing.id, payload);
      setData((current) => ({ ...current, scheduled: current.scheduled.map((item) => item.id === editing.id ? updated : item) }));
    } else {
      const created = await createScheduledReport(payload);
      setData((current) => ({ ...current, scheduled: [created, ...current.scheduled] }));
    }
    setEditing(null);
    showToast({ type: 'success', title: 'Reporte programado guardado' });
  };

  const deleteSelected = async () => {
    await deleteScheduledReport(deleting.id);
    setData((current) => ({ ...current, scheduled: current.scheduled.filter((item) => item.id !== deleting.id) }));
    setDeleting(null);
    showToast({ type: 'success', title: 'Reporte eliminado' });
  };

  const toggleScheduled = async (row) => {
    const updated = await toggleScheduledReport(row.id);
    setData((current) => ({ ...current, scheduled: current.scheduled.map((item) => item.id === row.id ? updated : item) }));
    showToast({ type: 'info', title: 'Estado actualizado' });
  };

  const applyFilters = (values) => setFilters({ dateFrom: values.dateFrom || undefined, dateTo: values.dateTo || undefined });

  const exportNow = async (values) => {
    setExporting(true);
    try {
      const response = await exportReport({
        reportType: values.reportType,
        format: values.format,
        filters: { dateFrom: values.dateFrom || undefined, dateTo: values.dateTo || undefined }
      });
      downloadFile(response, `${values.reportType.toLowerCase()}.${values.format.toLowerCase()}`);
      showToast({ type: 'success', title: 'Reporte exportado' });
    } finally {
      setExporting(false);
    }
  };

  const overview = data?.overview || {};
  const monthly = (overview.monthlyVolume || []).map((item) => ({ name: item.month, tickets: item.count || 0 }));
  const byStatus = overview.ticketsByStatus || [];
  const byPriority = (overview.ticketsByPriority || []).map((item) => ({ name: priorityLabel[item.priority] || item.priority, value: item.count || 0 }));
  const statusChart = byStatus.map((item) => ({ name: statusLabel[item.status] || item.status, value: item.count || 0 }));
  const service = overview.serviceOperations || {};
  const replacements = (service.replacementsByStatus || []).map((item) => ({ name: replacementLabel[item.status] || item.status, value: item.count || 0 }));
  const technicians = [...(overview.ticketsByTechnician || [])].filter((item) => item.technicianId).sort((a, b) => b.score - a.score).slice(0, 3);
  const active = ['OPEN', 'ASSIGNED', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'REOPENED'].reduce((sum, status) => sum + getCount(byStatus, status), 0);
  const waiting = getCount(byStatus, 'WAITING_CUSTOMER') + getCount(byStatus, 'PENDING');
  const completed = getCount(byStatus, 'RESOLVED') + getCount(byStatus, 'CLOSED');
  const health = Math.max(0, Math.min(100, Number(overview.slaCompliance?.complianceRate || 0) - (overview.reopenedRate?.reopenedRate || 0) - Math.min(waiting * 3, 20)));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reportes</h1>
          <p className="mt-1 text-sm text-neutral-500">KPIs ejecutivos, exportaciones legibles y programacion real.</p>
        </div>
        <Button onClick={() => openScheduled()}><Plus className="h-4 w-4" />Programar nuevo</Button>
      </div>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{error}</div>}

      <Card className="p-4">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={filterForm.handleSubmit(applyFilters)}>
          <FormInput register={filterForm.register} name="dateFrom" id="kpi-date-from" type="date" label="Desde" />
          <FormInput register={filterForm.register} name="dateTo" id="kpi-date-to" type="date" label="Hasta" />
          <Button type="submit" className="md:self-end">Actualizar KPIs</Button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Salud general" value={pct(health)} helper={health >= 85 ? 'Estable' : health >= 65 ? 'Vigilar' : 'Critico'} icon={AlertTriangle} tone={health >= 85 ? 'success' : health >= 65 ? 'warning' : 'danger'} />
        <StatCard title="Activos" value={active} icon={TicketPlus} />
        <StatCard title="En espera" value={waiting} icon={Clock3} tone={waiting > 0 ? 'warning' : 'neutral'} />
        <StatCard title="Completados" value={completed} icon={TicketCheck} tone="success" />
        <StatCard title="SLA cumplido" value={pct(overview.slaCompliance?.complianceRate)} helper={`${overview.slaCompliance?.breached || 0} vencidos`} icon={CheckCircle2} tone="success" />
        <StatCard title="Respuesta promedio" value={`${overview.avgResponseTime?.averageHours || 0} h`} icon={Clock3} />
        <StatCard title="Calificacion" value={overview.ratingSummary?.average ?? 0} helper={`${overview.ratingSummary?.count || 0} opiniones`} icon={Star} tone="warning" />
        <StatCard title="Reabiertos" value={pct(overview.reopenedRate?.reopenedRate)} icon={AlertTriangle} tone={(overview.reopenedRate?.reopenedRate || 0) > 10 ? 'danger' : 'neutral'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Tickets por prioridad</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPriority}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 xl:col-span-2">
          <h2 className="text-sm font-semibold text-neutral-900">Volumen mensual</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
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
          <h2 className="text-sm font-semibold text-neutral-900">Estados de casos</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" outerRadius={86} label={({ name, value }) => `${name}: ${value}`}>
                  {statusChart.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Reemplazos</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={replacements} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} label={({ name, value }) => `${name}: ${value}`}>
                  {replacements.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Operacion</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { label: 'Reemplazos abiertos', value: (service.replacementsByStatus || []).filter((item) => item.status !== 'DELIVERED' && item.status !== 'REJECTED').reduce((sum, item) => sum + item.count, 0), icon: PackageCheck },
              { label: 'Reembolsos registrados', value: service.refundCount || 0, icon: WalletCards },
              { label: 'Monto reembolsado', value: money(service.refundAmount), icon: WalletCards },
              { label: 'Empleado del mes', value: technicians[0]?.technicianName || 'Sin datos', icon: Award }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-md border border-neutral-200 p-3">
                <Icon className="h-5 w-5 text-primary-700" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-900">{value}</p>
                  <p className="text-xs text-neutral-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Top 3 tecnicos</h2>
        <DataTable
          searchable={false}
          pageSize={3}
          loading={isLoading}
          data={technicians}
          columns={[
            { key: 'technicianName', header: 'Tecnico' },
            { key: 'resolved', header: 'Resueltos' },
            { key: 'open', header: 'Abiertos' },
            { key: 'resolutionRate', header: 'Resolucion', render: (row) => pct(row.resolutionRate) },
            { key: 'ratingAverage', header: 'Rating', render: (row) => row.ratingAverage || 0 }
          ]}
        />
      </Card>

      <Card className="p-4">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={exportForm.handleSubmit(exportNow)}>
          <FormSelect register={exportForm.register} name="reportType" label="Reporte" options={reportTypes} />
          <FormSelect register={exportForm.register} name="format" label="Formato" options={[{ value: 'CSV', label: 'CSV' }, { value: 'EXCEL', label: 'Excel' }, { value: 'PDF', label: 'PDF' }]} />
          <FormInput register={exportForm.register} name="dateFrom" id="export-date-from" type="date" label="Desde" />
          <FormInput register={exportForm.register} name="dateTo" id="export-date-to" type="date" label="Hasta" />
          <Button type="submit" className="md:self-end" isLoading={exporting}><Download className="h-4 w-4" />Exportar</Button>
        </form>
      </Card>

      <DataTable
        data={data?.scheduled || []}
        loading={isLoading}
        error={error}
        columns={[
          { key: 'name', header: 'Nombre', sortable: true },
          { key: 'reportType', header: 'Tipo', render: (row) => reportTypeLabel[row.reportType] || row.reportType },
          { key: 'frequency', header: 'Frecuencia', render: (row) => frequencyLabel[row.frequency] || row.frequency },
          { key: 'recipients', header: 'Destinatarios', render: (row) => (row.recipients || []).join(', ') },
          { key: 'format', header: 'Formato' },
          { key: 'active', header: 'Estado', render: (row) => row.active ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => toggleScheduled(row)}>{row.active ? 'Desactivar' : 'Activar'}</Button>
                <Button variant="ghost" onClick={() => openScheduled(row)}><Edit className="h-4 w-4" />Editar</Button>
                <Button variant="ghost" onClick={() => setDeleting(row)}><Trash2 className="h-4 w-4" />Eliminar</Button>
              </div>
            )
          }
        ]}
      />

      <Modal isOpen={Boolean(editing)} title="Programar reporte" onClose={() => setEditing(null)} maxWidth="max-w-2xl">
        <form className="grid gap-4" onSubmit={form.handleSubmit(saveScheduled)}>
          <FormInput register={form.register} name="name" label="Nombre" error={form.formState.errors.name} placeholder="Resumen gerencial semanal" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect register={form.register} name="reportType" label="Tipo" error={form.formState.errors.reportType} options={reportTypes} />
            <FormSelect register={form.register} name="frequency" label="Frecuencia" error={form.formState.errors.frequency} options={[{ value: 'DAILY', label: 'Diario' }, { value: 'WEEKLY', label: 'Semanal' }, { value: 'MONTHLY', label: 'Mensual' }]} />
          </div>
          <label className="grid gap-1.5 text-sm font-medium text-neutral-700" htmlFor="parameters">
            <span>Parametros JSON</span>
            <textarea id="parameters" rows={4} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" placeholder='{"priority":"HIGH"}' {...form.register('parameters')} />
          </label>
          <Controller control={form.control} name="recipients" render={({ field, fieldState }) => <EmailChipInput label="Destinatarios" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />} />
          <FormSelect register={form.register} name="format" label="Formato" error={form.formState.errors.format} options={[{ value: 'CSV', label: 'CSV' }, { value: 'EXCEL', label: 'Excel' }, { value: 'PDF', label: 'PDF' }]} />
          <Button type="submit" isLoading={form.formState.isSubmitting}>Guardar programacion</Button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleting)} title="Eliminar reporte programado" message={`Eliminar ${deleting?.name}?`} onCancel={() => setDeleting(null)} onConfirm={deleteSelected} />
    </div>
  );
};

export default Reportes;
