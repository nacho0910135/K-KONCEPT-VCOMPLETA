import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import EmailChipInput from '../../components/forms/EmailChipInput.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { createScheduledReport, deleteScheduledReport, listScheduledReports, toggleScheduledReport, updateScheduledReport } from '../../services/admin.client.service.js';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { frequencyLabel, reportTypeLabel } from './adminUtils.jsx';

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

const Reportes = () => {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { showToast } = useToast();
  const { data, setData, isLoading, error } = useAdminResource(async () => {
    const response = await listScheduledReports({ limit: 100 });
    return response.data?.items || response.data || [];
  }, []);
  const form = useForm({ resolver: zodResolver(scheduledSchema), defaultValues: { name: '', reportType: 'KPI_OVERVIEW', parameters: '', frequency: 'WEEKLY', recipients: [], format: 'PDF' } });

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
      setData((current) => current.map((item) => item.id === editing.id ? updated : item));
    } else {
      const created = await createScheduledReport(payload);
      setData((current) => [created, ...current]);
    }
    setEditing(null);
    showToast({ type: 'success', title: 'Reporte programado guardado' });
  };

  const deleteSelected = async () => {
    await deleteScheduledReport(deleting.id);
    setData((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    showToast({ type: 'success', title: 'Reporte eliminado' });
  };

  const toggleScheduled = async (row) => {
    const updated = await toggleScheduledReport(row.id);
    setData((current) => current.map((item) => item.id === row.id ? updated : item));
    showToast({ type: 'info', title: 'Estado actualizado' });
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reportes</h1>
          <p className="mt-1 text-sm text-neutral-500">Programacion real de reportes con destinatarios.</p>
        </div>
        <Button onClick={() => openScheduled()}><Plus className="h-4 w-4" />Programar nuevo</Button>
      </div>

      <Card className="p-4 text-sm text-neutral-600">
        Los reportes programados se guardan en el backend y se ejecutan segun la configuracion de cron del servidor.
      </Card>

      <DataTable
        data={data || []}
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
