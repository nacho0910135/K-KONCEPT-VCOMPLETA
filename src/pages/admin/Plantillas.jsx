import { zodResolver } from '@hookform/resolvers/zod';
import { Edit } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import Toggle from '../../components/common/Toggle.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { listNotificationTemplates, toggleNotificationTemplate, updateNotificationTemplate } from '../../services/admin.client.service.js';
import { channelLabel, eventLabel } from './adminUtils.jsx';

const templateSchema = z.object({
  event: z.string().min(1, 'Evento requerido'),
  channel: z.string().min(1, 'Canal requerido'),
  subject: z.string().optional(),
  body: z.string().min(5, 'Mensaje requerido'),
  active: z.boolean().optional()
}).superRefine((value, ctx) => {
  if (value.channel === 'EMAIL' && !value.subject?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['subject'], message: 'El asunto es obligatorio para correos.' });
  }
});

const variables = [
  '{{userName}}',
  '{{ticketCode}}',
  '{{ticketTitle}}',
  '{{ticketDescription}}',
  '{{clientName}}',
  '{{technicianName}}',
  '{{categoryName}}',
  '{{subcategoryName}}',
  '{{priority}}',
  '{{status}}',
  '{{previousStatus}}',
  '{{newStatus}}',
  '{{comment}}',
  '{{commentAuthor}}',
  '{{commentText}}',
  '{{ticketUrl}}',
  '{{slaDueAt}}',
  '{{deadlineAt}}',
  '{{appointmentDate}}'
];
const sampleValues = {
  '{{userName}}': 'Laura Campos',
  '{{ticketCode}}': 'KK-1025',
  '{{ticketTitle}}': 'Impresora sin conexion',
  '{{ticketDescription}}': 'El equipo no responde al enviar trabajos de impresion.',
  '{{clientName}}': 'Industrias Sur',
  '{{technicianName}}': 'Andres Mora',
  '{{categoryName}}': 'Soporte tecnico',
  '{{subcategoryName}}': 'Impresoras',
  '{{priority}}': 'Critica',
  '{{status}}': 'En progreso',
  '{{previousStatus}}': 'Pendiente',
  '{{newStatus}}': 'En espera del cliente',
  '{{comment}}': 'Necesitamos una foto del error en pantalla.',
  '{{commentAuthor}}': 'Andres Mora',
  '{{commentText}}': 'Necesitamos una foto del error en pantalla.',
  '{{ticketUrl}}': 'https://app.kollabkoncepts.com/client/tickets/123',
  '{{slaDueAt}}': '21/05/2026 16:00',
  '{{deadlineAt}}': '21/05/2026 16:00',
  '{{appointmentDate}}': '22/05/2026 09:00'
};

const renderPreview = (value = '') => variables.reduce((text, variable) => text.replaceAll(variable, sampleValues[variable]), value);
const eventOptions = ['TICKET_CREATED', 'TICKET_ASSIGNED', 'STATUS_CHANGED', 'NEW_COMMENT', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'APPOINTMENT_RESCHEDULED', 'REPLACEMENT_APPROVED', 'SLA_BREACH'].map((value) => ({ value, label: eventLabel[value] || value }));
const channelOptions = ['EMAIL', 'IN_APP', 'SMS', 'PUSH'].map((value) => ({ value, label: channelLabel[value] || value }));

const Plantillas = () => {
  const { data, setData, isLoading, error } = useAdminResource(listNotificationTemplates, []);
  const [editing, setEditing] = useState(null);
  const [targetField, setTargetField] = useState('body');
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(templateSchema), defaultValues: { event: '', channel: 'EMAIL', subject: '', body: '', active: true } });
  const preview = useWatch({ control: form.control });

  const openEdit = (template) => {
    setEditing(template);
    form.reset({ ...template, body: template.bodyTemplate || template.body || '' });
  };

  const save = async (values) => {
    const updated = await updateNotificationTemplate(editing.id, {
      event: values.event,
      channel: values.channel,
      subject: values.subject || null,
      bodyTemplate: values.body,
      active: values.active
    });
    setData((current) => current.map((item) => item.id === editing.id ? updated : item));
    setEditing(null);
    showToast({ type: 'success', title: 'Plantilla actualizada' });
  };

  const toggle = async (template) => {
    const updated = await toggleNotificationTemplate(template.id);
    setData((current) => current.map((item) => item.id === template.id ? updated : item));
    showToast({ type: 'info', title: 'Estado actualizado' });
  };

  const insertVariable = (variable) => {
    const fieldName = targetField === 'subject' ? 'subject' : 'body';
    const element = fieldName === 'subject' ? subjectRef.current : bodyRef.current;
    const currentValue = form.getValues(fieldName) || '';
    const start = element?.selectionStart ?? currentValue.length;
    const end = element?.selectionEnd ?? currentValue.length;
    const nextValue = `${currentValue.slice(0, start)}${variable}${currentValue.slice(end)}`;
    form.setValue(fieldName, nextValue, { shouldDirty: true, shouldValidate: true });
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + variable.length, start + variable.length);
    });
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
          { key: 'event', header: 'Evento', sortable: true, render: (row) => eventLabel[row.event] || row.event },
          { key: 'channel', header: 'Canal', sortable: true, render: (row) => channelLabel[row.channel] || row.channel },
          { key: 'subject', header: 'Asunto', render: (row) => row.subject || 'Sin asunto' },
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

      <Modal isOpen={Boolean(editing)} title="Editor de plantilla" onClose={() => setEditing(null)} maxWidth="max-w-5xl">
        <form className="grid gap-4" onSubmit={form.handleSubmit(save)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect register={form.register} name="event" label="Evento" error={form.formState.errors.event} options={eventOptions} />
            <FormSelect register={form.register} name="channel" label="Canal" error={form.formState.errors.channel} options={channelOptions} />
          </div>
          <Toggle
            checked={Boolean(preview.active)}
            onChange={(checked) => form.setValue('active', checked, { shouldDirty: true })}
            label={preview.active ? 'Plantilla activa' : 'Plantilla inactiva'}
            description="Controla si esta plantilla puede ser usada por el motor de notificaciones."
          />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-neutral-700" htmlFor="subject">
                <span>Asunto</span>
                <input
                  id="subject"
                  className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  {...form.register('subject')}
                  ref={(element) => {
                    form.register('subject').ref(element);
                    subjectRef.current = element;
                  }}
                  onFocus={() => setTargetField('subject')}
                />
                {form.formState.errors.subject && <span className="text-xs font-medium text-danger">{form.formState.errors.subject.message}</span>}
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-neutral-700" htmlFor="body">
                <span>Mensaje</span>
                <textarea
                  id="body"
                  rows={9}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  {...form.register('body')}
                  ref={(element) => {
                    form.register('body').ref(element);
                    bodyRef.current = element;
                  }}
                  onFocus={() => setTargetField('body')}
                />
                {form.formState.errors.body && <span className="text-xs font-medium text-danger">{form.formState.errors.body.message}</span>}
              </label>
              <Card className="p-4">
                <p className="text-sm font-semibold text-neutral-900">Marcadores disponibles</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variables.map((item) => (
                    <Button key={item} variant="ghost" className="min-h-8 px-2 py-1" onClick={() => insertVariable(item)}>
                      {item}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-900">Vista previa en vivo</p>
                <Badge tone={preview.active ? 'success' : 'neutral'}>{preview.active ? 'Activa' : 'Inactiva'}</Badge>
              </div>
              <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase text-neutral-500">Asunto</p>
                <p className="mt-1 min-h-6 text-sm font-semibold text-neutral-900">{renderPreview(preview.subject) || 'Sin asunto'}</p>
                <p className="mt-4 text-xs font-semibold uppercase text-neutral-500">Mensaje</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-neutral-700">{renderPreview(preview.body) || 'Escribe un mensaje para previsualizar.'}</p>
              </div>
            </Card>
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={form.formState.isSubmitting}>Guardar plantilla</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Plantillas;
