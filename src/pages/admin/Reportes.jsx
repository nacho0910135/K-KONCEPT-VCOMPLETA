import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import DateRangePicker from '../../components/forms/DateRangePicker.jsx';
import EmailChipInput from '../../components/forms/EmailChipInput.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { dashboard, scheduledReports, tickets } from './adminMockData.js';
import { eventLabel, frequencyLabel, PriorityBadge, priorityLabel, reportTypeLabel, resultLabel, simulateAction, StateBadge, statusLabel } from './adminUtils.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';

const scheduledSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.string().min(1, 'Tipo requerido'),
  parameters: z.string().optional(),
  frequency: z.string().min(1, 'Frecuencia obligatoria'),
  recipients: z.array(z.string().email()).min(1, 'Agrega al menos un destinatario'),
  format: z.string().min(1, 'Formato requerido')
});

const reportTypes = ['KPI Overview', 'Tickets', 'SLA', 'Auditoria'];
const chartColors = ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444'];

const buildReportRows = (reportType, filters) => {
  if (filters.client === 'EMPTY') return [];
  if (reportType === 'KPI Overview') {
    return [
      { id: 'kpi-1', metric: 'Tickets abiertos', value: dashboard.summary.open },
      { id: 'kpi-2', metric: 'SLA cumplido', value: `${dashboard.summary.slaMet}%` },
      { id: 'kpi-3', metric: 'Calificacion promedio', value: dashboard.summary.rating },
      { id: 'kpi-4', metric: 'Tickets cerrados', value: dashboard.summary.closed }
    ];
  }
  if (reportType === 'SLA') {
    return tickets
      .filter((ticket) => filters.priority === 'ALL' || ticket.priority === filters.priority)
      .map((ticket) => ({ ...ticket, slaStatus: ticket.slaMet ? 'Cumplido' : 'En riesgo' }));
  }
  if (reportType === 'Auditoria') {
    return [
      { id: 'aud-1', action: 'TICKET_ASSIGNED', user: 'Admin Kollab', result: 'SUCCESS', createdAt: '2026-05-20T10:05:00' },
      { id: 'aud-2', action: 'EXPORT_REQUESTED', user: 'Admin Kollab', result: 'SUCCESS', createdAt: '2026-05-20T11:15:00' },
      { id: 'aud-3', action: 'SCHEDULED_REPORT_UPDATED', user: 'Admin Kollab', result: 'SUCCESS', createdAt: '2026-05-21T08:20:00' }
    ];
  }
  return tickets.filter((ticket) => (
    (filters.status === 'ALL' || ticket.status === filters.status)
    && (filters.priority === 'ALL' || ticket.priority === filters.priority)
    && (filters.client === 'ALL' || ticket.client === filters.client)
  ));
};

const Reportes = () => {
  const [tab, setTab] = useState('generate');
  const [reportType, setReportType] = useState('KPI Overview');
  const [dateRange, setDateRange] = useState({ from: '2026-05-01', to: '2026-05-21' });
  const [filters, setFilters] = useState({ status: 'ALL', priority: 'ALL', client: 'ALL' });
  const [visualized, setVisualized] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [reportAlert, setReportAlert] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data, setData, isLoading, error } = useAdminResource(() => scheduledReports, []);
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(scheduledSchema), defaultValues: { name: '', type: 'KPI Overview', parameters: '', frequency: 'WEEKLY', recipients: [], format: 'PDF' } });

  const reportRows = useMemo(() => buildReportRows(reportType, filters), [reportType, filters]);

  const visualize = async () => {
    setIsVisualizing(true);
    setReportAlert(null);
    await simulateAction(450);
    setVisualized(true);
    setIsVisualizing(false);
  };

  const exportReport = async (format) => {
    setExporting(format);
    setReportAlert(null);
    await simulateAction(500);
    if (!visualized || reportRows.length === 0) {
      setReportAlert('No hay datos para exportar con los filtros seleccionados. Ajusta el rango o los filtros y vuelve a intentar.');
      showToast({ type: 'warning', title: 'No hay datos', message: 'El servicio respondio 400 para esta exportacion.' });
      setExporting(null);
      return;
    }
    showToast({ type: 'success', title: `Exportacion ${format}`, message: 'Archivo solicitado con filtros activos.' });
    setExporting(null);
  };

  const saveScheduled = async (values) => {
    await simulateAction();
    if (editing?.id) {
      setData((current) => current.map((item) => item.id === editing.id ? { ...item, ...values } : item));
    } else {
      setData((current) => [{ id: crypto.randomUUID(), ...values, active: true }, ...current]);
    }
    setEditing(null);
    showToast({ type: 'success', title: 'Reporte programado guardado' });
  };

  const openScheduled = (row = null) => {
    setEditing(row || { mode: 'new' });
    form.reset(row
      ? { name: row.name || row.type, parameters: row.parameters || '', type: row.type, frequency: row.frequency, recipients: row.recipients, format: row.format }
      : { name: '', type: 'KPI Overview', parameters: '', frequency: 'WEEKLY', recipients: [], format: 'PDF' });
  };

  const deleteScheduled = async () => {
    await simulateAction();
    setData((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    showToast({ type: 'success', title: 'Reporte eliminado' });
  };

  const toggleScheduled = async (row) => {
    await simulateAction();
    setData((current) => current.map((item) => item.id === row.id ? { ...item, active: !item.active } : item));
    showToast({ type: 'info', title: 'Estado actualizado' });
  };

  const ticketColumns = [
    { key: 'code', header: 'Codigo' },
    { key: 'title', header: 'Titulo' },
    { key: 'status', header: 'Estado', render: (row) => <StateBadge value={row.status} /> },
    { key: 'priority', header: 'Prioridad', render: (row) => <PriorityBadge value={row.priority} /> },
    { key: 'client', header: 'Cliente' }
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reportes</h1>
        <p className="mt-1 text-sm text-neutral-500">Generacion, exportacion y programacion de reportes.</p>
      </div>

      <div className="flex gap-2 border-b border-neutral-200">
        <button className={`px-4 py-2 text-sm font-semibold ${tab === 'generate' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-neutral-500'}`} onClick={() => setTab('generate')}>Generar reporte</button>
        <button className={`px-4 py-2 text-sm font-semibold ${tab === 'scheduled' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-neutral-500'}`} onClick={() => setTab('scheduled')}>Reportes programados</button>
      </div>

      {tab === 'generate' ? (
        <div className="grid gap-6">
          <Card className="grid gap-4 p-4 md:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
              Tipo
              <select className="min-h-10 rounded-md border border-neutral-200 px-3" value={reportType} onChange={(event) => setReportType(event.target.value)}>
                {reportTypes.map((type) => <option key={type} value={type}>{reportTypeLabel[type] || type}</option>)}
              </select>
            </label>
            <div className="md:col-span-2"><DateRangePicker value={dateRange} onChange={setDateRange} /></div>
            <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
              Estado
              <select className="min-h-10 rounded-md border border-neutral-200 px-3" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="ALL">Todos</option>
                <option value="OPEN">{statusLabel.OPEN}</option>
                <option value="IN_PROGRESS">{statusLabel.IN_PROGRESS}</option>
                <option value="PENDING">{statusLabel.PENDING}</option>
                <option value="RESOLVED">{statusLabel.RESOLVED}</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
              Prioridad
              <select className="min-h-10 rounded-md border border-neutral-200 px-3" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
                <option value="ALL">Todas</option>
                <option value="LOW">{priorityLabel.LOW}</option>
                <option value="MEDIUM">{priorityLabel.MEDIUM}</option>
                <option value="HIGH">{priorityLabel.HIGH}</option>
                <option value="CRITICAL">{priorityLabel.CRITICAL}</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
              Cliente
              <select className="min-h-10 rounded-md border border-neutral-200 px-3" value={filters.client} onChange={(event) => setFilters((current) => ({ ...current, client: event.target.value }))}>
                <option value="ALL">Todos</option>
                <option value="Grupo Norte">Grupo Norte</option>
                <option value="Industrias Sur">Industrias Sur</option>
                <option value="EMPTY">Sin datos</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-3">
              <Button onClick={visualize} isLoading={isVisualizing}><Eye className="h-4 w-4" />Visualizar</Button>
              {['CSV', 'Excel', 'PDF'].map((format) => (
                <Button key={format} variant="ghost" onClick={() => exportReport(format)} isLoading={exporting === format}>
                  <Download className="h-4 w-4" />
                  Exportar a {format}
                </Button>
              ))}
            </div>
          </Card>
          {reportAlert && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{reportAlert}</div>}
          {visualized ? (
            <div className="grid gap-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-4">
                  <h2 className="text-sm font-semibold text-neutral-900">Tendencia mensual</h2>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboard.monthly}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="tickets" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="p-4">
                  <h2 className="text-sm font-semibold text-neutral-900">Distribucion por prioridad</h2>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {reportType === 'KPI Overview' ? (
                        <PieChart>
                          <Pie data={dashboard.categoryDistribution} dataKey="value" nameKey="name" outerRadius={90} label>
                            {dashboard.categoryDistribution.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      ) : (
                        <BarChart data={dashboard.byPriority}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
              <DataTable
                data={reportRows}
                emptyTitle="No hay datos"
                emptyDescription="No hay datos para los filtros seleccionados."
                columns={reportType === 'KPI Overview'
                  ? [{ key: 'metric', header: 'Metrica' }, { key: 'value', header: 'Valor' }]
                  : reportType === 'Auditoria'
                    ? [{ key: 'action', header: 'Accion', render: (row) => eventLabel[row.action] || row.action }, { key: 'user', header: 'Usuario' }, { key: 'result', header: 'Resultado', render: (row) => resultLabel[row.result] || row.result }, { key: 'createdAt', header: 'Fecha' }]
                    : reportType === 'SLA'
                      ? [...ticketColumns, { key: 'slaStatus', header: 'SLA' }]
                      : ticketColumns}
              />
            </div>
          ) : (
            <Card className="p-6 text-sm text-neutral-600">Selecciona filtros y visualiza el reporte para ver tablas y graficos.</Card>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex justify-end"><Button onClick={() => openScheduled()}><Plus className="h-4 w-4" />Programar nuevo</Button></div>
          <DataTable
            data={data || []}
            loading={isLoading}
            error={error}
            columns={[
              { key: 'name', header: 'Nombre', render: (row) => row.name || row.type },
              { key: 'type', header: 'Tipo', render: (row) => reportTypeLabel[row.type] || row.type },
              { key: 'frequency', header: 'Frecuencia', render: (row) => frequencyLabel[row.frequency] || row.frequency },
              { key: 'recipients', header: 'Destinatarios', render: (row) => row.recipients.join(', ') },
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
        </div>
      )}

      <Modal isOpen={Boolean(editing)} title="Programar reporte" onClose={() => setEditing(null)} maxWidth="max-w-2xl">
        <form className="grid gap-4" onSubmit={form.handleSubmit(saveScheduled)}>
          <FormInput register={form.register} name="name" label="Nombre" error={form.formState.errors.name} placeholder="Resumen gerencial semanal" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect register={form.register} name="type" label="Tipo" error={form.formState.errors.type} options={reportTypes.map((type) => ({ value: type, label: reportTypeLabel[type] || type }))} />
            <FormSelect register={form.register} name="frequency" label="Frecuencia" error={form.formState.errors.frequency} options={[{ value: 'DAILY', label: 'Diario' }, { value: 'WEEKLY', label: 'Semanal' }, { value: 'MONTHLY', label: 'Mensual' }]} />
          </div>
          <label className="grid gap-1.5 text-sm font-medium text-neutral-700" htmlFor="parameters">
            <span>Parametros</span>
            <textarea id="parameters" rows={4} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100" placeholder='{"estado":"Abierto","prioridad":"Alta"}' {...form.register('parameters')} />
          </label>
          <Controller control={form.control} name="recipients" render={({ field, fieldState }) => <EmailChipInput label="Destinatarios" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />} />
          <FormSelect register={form.register} name="format" label="Formato" error={form.formState.errors.format} options={[{ value: 'CSV', label: 'CSV' }, { value: 'Excel', label: 'Excel' }, { value: 'PDF', label: 'PDF' }]} />
          <Button type="submit" isLoading={form.formState.isSubmitting}>Guardar programacion</Button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleting)} title="Eliminar reporte programado" message={`Eliminar ${reportTypeLabel[deleting?.type] || deleting?.type}?`} onCancel={() => setDeleting(null)} onConfirm={deleteScheduled} />
    </div>
  );
};

export default Reportes;
