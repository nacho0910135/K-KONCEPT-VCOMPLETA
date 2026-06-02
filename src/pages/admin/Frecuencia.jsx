import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { createNotificationFrequencyRule, listNotificationFrequencyRules, toggleNotificationFrequencyRule, updateNotificationFrequencyRule } from '../../services/admin.client.service.js';
import { eventLabel } from './adminUtils.jsx';

const frequencySchema = z.object({
  event: z.string().min(1, 'Evento requerido'),
  maxPerUserPerHour: z.coerce.number().min(1, 'Minimo 1'),
  maxPerUserPerDay: z.coerce.number().min(1, 'Minimo 1')
}).superRefine((value, ctx) => {
  if (value.maxPerUserPerHour > value.maxPerUserPerDay) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['maxPerUserPerHour'],
      message: 'Max por hora no puede ser mayor que max por dia.'
    });
  }
});

const eventOptions = ['TICKET_CREATED', 'TICKET_ASSIGNED', 'STATUS_CHANGED', 'NEW_COMMENT', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'APPOINTMENT_RESCHEDULED', 'REPLACEMENT_APPROVED', 'SLA_BREACH'].map((value) => ({ value, label: eventLabel[value] || value }));

const Frecuencia = () => {
  const { data, setData, isLoading, error } = useAdminResource(listNotificationFrequencyRules, []);
  const [editing, setEditing] = useState(null);
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(frequencySchema), defaultValues: { event: '', maxPerUserPerHour: 1, maxPerUserPerDay: 10 } });

  const open = (rule = null) => {
    setEditing(rule || { mode: 'new' });
    form.reset(rule || { event: '', maxPerUserPerHour: 1, maxPerUserPerDay: 10 });
  };

  const save = async (values) => {
    const payload = {
      event: values.event,
      maxPerUserPerHour: values.maxPerUserPerHour,
      maxPerUserPerDay: values.maxPerUserPerDay
    };
    if (editing?.id) {
      const updated = await updateNotificationFrequencyRule(editing.id, payload);
      setData((current) => current.map((item) => item.id === editing.id ? updated : item));
    } else {
      const created = await createNotificationFrequencyRule(payload);
      setData((current) => [created, ...current]);
    }
    setEditing(null);
    showToast({ type: 'success', title: 'Regla guardada' });
  };

  const toggle = async (rule) => {
    const updated = await toggleNotificationFrequencyRule(rule.id);
    setData((current) => current.map((item) => item.id === rule.id ? updated : item));
    showToast({ type: 'info', title: 'Estado actualizado' });
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reglas de frecuencia</h1>
          <p className="mt-1 text-sm text-neutral-500">Control de volumen de notificaciones por evento.</p>
        </div>
        <Button onClick={() => open()}><Plus className="h-4 w-4" />Crear regla</Button>
      </div>
      <DataTable
        data={data || []}
        loading={isLoading}
        error={error}
        columns={[
          { key: 'event', header: 'Evento', sortable: true, render: (row) => eventLabel[row.event] || row.event },
          { key: 'maxPerUserPerHour', header: 'Max/hora' },
          { key: 'maxPerUserPerDay', header: 'Max/dia' },
          { key: 'active', header: 'Estado', render: (row) => row.active ? <Badge tone="success">Activa</Badge> : <Badge>Inactiva</Badge> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => open(row)}><Edit className="h-4 w-4" />Editar</Button>
                <Button variant="ghost" onClick={() => toggle(row)}>{row.active ? 'Desactivar' : 'Activar'}</Button>
              </div>
            )
          }
        ]}
      />
      <Modal isOpen={Boolean(editing)} title="Regla de frecuencia" onClose={() => setEditing(null)}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(save)}>
          <FormSelect register={form.register} name="event" label="Evento" error={form.formState.errors.event} options={eventOptions} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput register={form.register} name="maxPerUserPerHour" type="number" label="Max por hora" error={form.formState.errors.maxPerUserPerHour} />
            <FormInput register={form.register} name="maxPerUserPerDay" type="number" label="Max por dia" error={form.formState.errors.maxPerUserPerDay} />
          </div>
          <Button type="submit" isLoading={form.formState.isSubmitting}>Guardar regla</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Frecuencia;
