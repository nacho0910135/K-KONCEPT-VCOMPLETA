import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Edit, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import DateRangePicker from '../../components/forms/DateRangePicker.jsx';
import EmailChipInput from '../../components/forms/EmailChipInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { dashboard, scheduledReports, tickets } from './adminMockData.js';
import { PriorityBadge, simulateAction, StateBadge } from './adminUtils.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';

const scheduledSchema = z.object({
  type: z.string().min(1, 'Tipo requerido'),
  frequency: z.string().min(1, 'Frecuencia obligatoria'),
  recipients: z.array(z.string().email()).min(1, 'Agrega al menos un destinatario'),
  format: z.string().min(1, 'Formato requerido')
});

const Reportes = () => {
  const [tab, setTab] = useState('generate');
  const [reportType, setReportType] = useState('KPI Overview');
  const [dateRange, setDateRange] = useState({ from: '2026-05-01', to: '2026-05-21' });
  const [visualized, setVisualized] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data, setData, isLoading, error } = useAdminResource(() => scheduledReports, []);
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(scheduledSchema), defaultValues: { type: 'KPI Overview', frequency: 'WEEKLY', recipients: [], format: 'PDF' } });

  const reportRows = useMemo(() => (reportType === 'KPI Overview'
    ? [{ id: 'kpi-1', metric: 'SLA cumplido', value: `${dashboard.summary.slaMet}%` }, { id: 'kpi-2', metric: 'Rating promedio', value: dashboard.summary.rating }]
    : tickets
  ), [reportType]);

  const exportReport = (format) => {
    if (!visualized || reportRows.length === 0) {
      showToast({ type: 'warning', title: 'Sin datos para exportar', message: 'Visualiza un reporte antes de exportarlo.' });
      return;
    }
    showToast({ type: 'success', title: `Export ${format}`, message: 'Archivo solicitado con filtros activos.' });
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
    form.reset(row || { type: 'KPI Overview', frequency: 'WEEKLY', recipients: [], format: 'PDF' });
  };

  const deleteScheduled = async () => {
    await simulateAction();
    setData((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    showToast({ type: 'success', title: 'Reporte eliminado' });
  };

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
                <option>KPI Overview</option>
                <option>Tickets</option>
                <option>SLA</option>
              </select>
            </label>
            <div className="md:col-span-2"><DateRangePicker value={dateRange} onChange={setDateRange} /></div>
            <div className="flex flex-wrap gap-2 md:col-span-3">
              <Button onClick={() => setVisualized(true)}>Visualizar</Button>
              {['CSV', 'Excel', 'PDF'].map((format) => <Button key={format} variant="ghost" onClick={() => exportReport(format)}><Download className="h-4 w-4" />{format}</Button>)}
            </div>
          </Card>
          {visualized ? (
            <DataTable
              data={reportRows}
              columns={reportType === 'KPI Overview'
                ? [{ key: 'metric', header: 'Metrica' }, { key: 'value', header: 'Valor' }]
                : [
                  { key: 'code', header: 'Codigo' },
                  { key: 'title', header: 'Titulo' },
                  { key: 'status', header: 'Estado', render: (row) => <StateBadge value={row.status} /> },
                  { key: 'priority', header: 'Prioridad', render: (row) => <PriorityBadge value={row.priority} /> }
                ]}
            />
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
              { key: 'type', header: 'Tipo' },
              { key: 'frequency', header: 'Frecuencia' },
              { key: 'recipients', header: 'Destinatarios', render: (row) => row.recipients.join(', ') },
              { key: 'format', header: 'Formato' },
              { key: 'active', header: 'Estado', render: (row) => row.active ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge> },
              { key: 'actions', header: 'Acciones', render: (row) => <div className="flex gap-2"><Button variant="ghost" onClick={() => openScheduled(row)}><Edit className="h-4 w-4" />Editar</Button><Button variant="ghost" onClick={() => setDeleting(row)}><Trash2 className="h-4 w-4" />Eliminar</Button></div> }
            ]}
          />
        </div>
      )}

      <Modal isOpen={Boolean(editing)} title="Programar reporte" onClose={() => setEditing(null)}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(saveScheduled)}>
          <FormSelect register={form.register} name="type" label="Tipo" error={form.formState.errors.type} options={[{ value: 'KPI Overview', label: 'KPI Overview' }, { value: 'Tickets', label: 'Tickets' }, { value: 'SLA', label: 'SLA' }]} />
          <FormSelect register={form.register} name="frequency" label="Frecuencia" error={form.formState.errors.frequency} options={[{ value: 'DAILY', label: 'Diario' }, { value: 'WEEKLY', label: 'Semanal' }, { value: 'MONTHLY', label: 'Mensual' }]} />
          <Controller control={form.control} name="recipients" render={({ field, fieldState }) => <EmailChipInput label="Destinatarios" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />} />
          <FormSelect register={form.register} name="format" label="Formato" error={form.formState.errors.format} options={[{ value: 'CSV', label: 'CSV' }, { value: 'Excel', label: 'Excel' }, { value: 'PDF', label: 'PDF' }]} />
          <Button type="submit" isLoading={form.formState.isSubmitting}>Guardar programacion</Button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleting)} title="Eliminar reporte programado" message={`Eliminar ${deleting?.type}?`} onCancel={() => setDeleting(null)} onConfirm={deleteScheduled} />
    </div>
  );
};

export default Reportes;
