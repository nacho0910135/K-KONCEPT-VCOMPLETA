import { zodResolver } from '@hookform/resolvers/zod';
import { Edit } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { simulateAction } from './adminUtils.jsx';
import { templates } from './adminMockData.js';

const templateSchema = z.object({
  event: z.string().min(1, 'Evento requerido'),
  channel: z.string().min(1, 'Canal requerido'),
  subject: z.string().optional(),
  body: z.string().min(5, 'Mensaje requerido'),
  active: z.boolean().optional()
}).superRefine((value, ctx) => {
  if (value.channel === 'EMAIL' && !value.subject?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['subject'], message: 'Subject es obligatorio para EMAIL' });
  }
});

const variables = ['{{code}}', '{{clientName}}', '{{technicianName}}', '{{priority}}', '{{status}}'];

const Plantillas = () => {
  const { data, setData, isLoading, error } = useAdminResource(() => templates, []);
  const [editing, setEditing] = useState(null);
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(templateSchema), defaultValues: { event: '', channel: 'EMAIL', subject: '', body: '', active: true } });
  const preview = useWatch({ control: form.control });

  const openEdit = (template) => {
    setEditing(template);
    form.reset(template);
  };

  const save = async (values) => {
    await simulateAction();
    setData((current) => current.map((item) => item.id === editing.id ? { ...item, ...values } : item));
    setEditing(null);
    showToast({ type: 'success', title: 'Plantilla actualizada' });
  };

  const toggle = async (template) => {
    await simulateAction();
    setData((current) => current.map((item) => item.id === template.id ? { ...item, active: !item.active } : item));
    showToast({ type: 'info', title: 'Estado actualizado' });
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Plantillas de notificacion</h1>
        <p className="mt-1 text-sm text-neutral-500">Mensajes por evento, canal y variables disponibles.</p>
      </div>
      <DataTable
        data={data || []}
        loading={isLoading}
        error={error}
        columns={[
          { key: 'event', header: 'Evento', sortable: true },
          { key: 'channel', header: 'Canal', sortable: true },
          { key: 'subject', header: 'Subject' },
          { key: 'active', header: 'Estado', render: (row) => row.active ? <Badge tone="success">Activa</Badge> : <Badge>Inactiva</Badge> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => openEdit(row)}><Edit className="h-4 w-4" />Editar</Button>
                <Button variant="ghost" onClick={() => toggle(row)}>{row.active ? 'Desactivar' : 'Activar'}</Button>
              </div>
            )
          }
        ]}
      />

      <Modal isOpen={Boolean(editing)} title="Editor de plantilla" onClose={() => setEditing(null)}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(save)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect register={form.register} name="event" label="Evento" error={form.formState.errors.event} options={[{ value: 'TICKET_CREATED', label: 'TICKET_CREATED' }, { value: 'TICKET_ASSIGNED', label: 'TICKET_ASSIGNED' }, { value: 'SLA_RISK', label: 'SLA_RISK' }]} />
            <FormSelect register={form.register} name="channel" label="Canal" error={form.formState.errors.channel} options={[{ value: 'EMAIL', label: 'EMAIL' }, { value: 'IN_APP', label: 'IN_APP' }, { value: 'SMS', label: 'SMS' }, { value: 'PUSH', label: 'PUSH' }]} />
          </div>
          <FormInput register={form.register} name="subject" label="Subject" error={form.formState.errors.subject} />
          <FormTextarea register={form.register} name="body" label="Mensaje" error={form.formState.errors.body} rows={5} />
          <Card className="p-4">
            <p className="text-sm font-semibold text-neutral-900">Variables disponibles</p>
            <div className="mt-2 flex flex-wrap gap-2">{variables.map((item) => <Badge key={item} tone="primary">{item}</Badge>)}</div>
            <p className="mt-4 text-sm font-semibold text-neutral-900">Preview</p>
            <p className="mt-1 rounded-md bg-neutral-50 p-3 text-sm text-neutral-600">{preview.body || 'Escribe un mensaje para previsualizar.'}</p>
          </Card>
          <Button type="submit" isLoading={form.formState.isSubmitting}>Guardar plantilla</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Plantillas;
