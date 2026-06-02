import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Settings2 } from 'lucide-react';
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
import { createSla, listSlas, updateSla } from '../../services/admin.client.service.js';
import { priorityLabel } from './adminUtils.jsx';

const slaSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').optional(),
  priority: z.string().optional(),
  maxResponseHours: z.coerce.number().min(1, 'Debe ser mayor a 0'),
  maxResolutionHours: z.coerce.number().min(1, 'Debe ser mayor a 0'),
  scope: z.enum(['NEW_ONLY', 'RECALCULATE_OPEN']).optional()
}).superRefine((value, ctx) => {
  if (value.maxResolutionHours < value.maxResponseHours) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['maxResolutionHours'], message: 'Resolucion debe ser mayor o igual a respuesta.' });
  }
  if (!value.scope && !value.priority) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['priority'], message: 'Selecciona una prioridad.' });
  }
});

const priorityOptions = [
  { value: '', label: 'Selecciona prioridad' },
  { value: 'LOW', label: priorityLabel.LOW },
  { value: 'MEDIUM', label: priorityLabel.MEDIUM },
  { value: 'HIGH', label: priorityLabel.HIGH },
  { value: 'CRITICAL', label: priorityLabel.CRITICAL }
];

const getScope = (sla) => {
  if (sla.priority) return `Prioridad ${priorityLabel[sla.priority] || sla.priority}`;
  if (sla.category?.name) return `Categoria ${sla.category.name}`;
  if (sla.client?.name) return `Cliente ${sla.client.name}`;
  return 'Regla especifica';
};

const SLAs = () => {
  const { data, setData, isLoading, error } = useAdminResource(async () => {
    const response = await listSlas({ limit: 100, includeVersions: false });
    return response.data?.items || response.data || [];
  }, []);
  const [editing, setEditing] = useState(null);
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(slaSchema), defaultValues: { name: '', priority: '', maxResponseHours: 1, maxResolutionHours: 8, scope: 'NEW_ONLY' } });

  const openNew = () => {
    setEditing({ mode: 'new' });
    form.reset({ name: '', priority: '', maxResponseHours: 1, maxResolutionHours: 8, scope: undefined });
  };

  const openEdit = (sla) => {
    setEditing(sla);
    form.reset({ name: sla.name, priority: sla.priority || '', maxResponseHours: sla.maxResponseHours, maxResolutionHours: sla.maxResolutionHours, scope: 'NEW_ONLY' });
  };

  const save = async (values) => {
    if (editing?.id) {
      const updated = await updateSla(editing.id, {
        maxResponseHours: values.maxResponseHours,
        maxResolutionHours: values.maxResolutionHours,
        scope: values.scope || 'NEW_ONLY'
      });
      setData((current) => current.map((item) => item.id === editing.id ? updated : item));
      showToast({ type: 'success', title: 'SLA actualizado' });
    } else {
      const created = await createSla({
        name: values.name,
        priority: values.priority,
        maxResponseHours: values.maxResponseHours,
        maxResolutionHours: values.maxResolutionHours
      });
      setData((current) => [created, ...current]);
      showToast({ type: 'success', title: 'SLA creado' });
    }
    setEditing(null);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">SLAs</h1>
          <p className="mt-1 text-sm text-neutral-500">Reglas reales de respuesta y resolucion.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" />Nuevo SLA</Button>
      </div>

      <DataTable
        data={data || []}
        loading={isLoading}
        error={error}
        columns={[
          { key: 'name', header: 'Nombre', sortable: true },
          { key: 'scope', header: 'Alcance', render: getScope },
          { key: 'maxResponseHours', header: 'Respuesta', render: (row) => `${row.maxResponseHours}h` },
          { key: 'maxResolutionHours', header: 'Resolucion', render: (row) => `${row.maxResolutionHours}h` },
          { key: 'version', header: 'Version', render: (row) => row.version || 1 },
          { key: 'active', header: 'Estado', render: (row) => row.active ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge> },
          { key: 'actions', header: 'Acciones', render: (row) => <Button variant="ghost" onClick={() => openEdit(row)}><Settings2 className="h-4 w-4" />Editar</Button> }
        ]}
      />

      <Modal isOpen={Boolean(editing)} title={editing?.id ? 'Editar SLA' : 'Nuevo SLA'} onClose={() => setEditing(null)}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(save)}>
          {!editing?.id && <FormInput register={form.register} name="name" label="Nombre" error={form.formState.errors.name} />}
          {!editing?.id && <FormSelect register={form.register} name="priority" label="Prioridad" error={form.formState.errors.priority} options={priorityOptions} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput register={form.register} name="maxResponseHours" type="number" label="Max respuesta (horas)" error={form.formState.errors.maxResponseHours} />
            <FormInput register={form.register} name="maxResolutionHours" type="number" label="Max resolucion (horas)" error={form.formState.errors.maxResolutionHours} />
          </div>
          {editing?.id && (
            <FormSelect
              register={form.register}
              name="scope"
              label="Alcance del cambio"
              error={form.formState.errors.scope}
              options={[
                { value: 'NEW_ONLY', label: 'Solo nuevos tickets' },
                { value: 'RECALCULATE_OPEN', label: 'Recalcular tickets abiertos' }
              ]}
            />
          )}
          <Button type="submit" isLoading={form.formState.isSubmitting}>Guardar SLA</Button>
        </form>
      </Modal>
    </div>
  );
};

export default SLAs;
