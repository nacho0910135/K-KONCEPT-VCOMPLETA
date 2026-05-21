import { zodResolver } from '@hookform/resolvers/zod';
import { History, Plus, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Drawer from '../../components/common/Drawer.jsx';
import Modal from '../../components/common/Modal.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { simulateAction } from './adminUtils.jsx';
import { slaVersions, slas } from './adminMockData.js';
import { formatDate } from '../../utils/formatDate.js';

const slaSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  maxResponseHours: z.coerce.number().min(1, 'Debe ser mayor a 0'),
  maxResolutionHours: z.coerce.number().min(1, 'Debe ser mayor a 0'),
  scope: z.string().min(2, 'Define el alcance'),
  changeScope: z.enum(['NEW_ONLY', 'RECALCULATE_OPEN']).optional()
});

const SLAs = () => {
  const { data, setData, isLoading, error } = useAdminResource(() => slas, []);
  const [editing, setEditing] = useState(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(slaSchema), defaultValues: { name: '', maxResponseHours: 1, maxResolutionHours: 8, scope: '', changeScope: 'NEW_ONLY' } });

  const openNew = () => {
    setEditing({ mode: 'new' });
    form.reset({ name: '', maxResponseHours: 1, maxResolutionHours: 8, scope: '', changeScope: 'NEW_ONLY' });
  };

  const openEdit = (sla) => {
    setEditing(sla);
    form.reset({ ...sla, changeScope: 'NEW_ONLY' });
  };

  const save = async (values) => {
    await simulateAction();
    if (editing?.id) {
      setData((current) => current.map((item) => item.id === editing.id ? { ...item, ...values } : item));
      showToast({ type: 'success', title: 'SLA actualizado', message: values.changeScope === 'RECALCULATE_OPEN' ? 'Tickets abiertos recalculados.' : 'Aplicara a nuevos tickets.' });
    } else {
      setData((current) => [{ id: crypto.randomUUID(), ...values, active: true, exception: values.scope.toLowerCase().includes('cliente') }, ...current]);
      showToast({ type: 'success', title: 'SLA creado' });
    }
    setEditing(null);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">SLAs</h1>
          <p className="mt-1 text-sm text-neutral-500">Reglas de respuesta, resolucion y excepciones.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" />Nuevo SLA</Button>
      </div>

      <DataTable
        searchable={false}
        data={data || []}
        loading={isLoading}
        error={error}
        columns={[
          { key: 'name', header: 'Nombre', sortable: true },
          { key: 'scope', header: 'Alcance', render: (row) => <div className="flex flex-wrap gap-2"><span>{row.scope}</span>{row.exception && <Badge tone="warning">Excepcion</Badge>}</div> },
          { key: 'maxResponseHours', header: 'Respuesta', render: (row) => `${row.maxResponseHours}h` },
          { key: 'maxResolutionHours', header: 'Resolucion', render: (row) => `${row.maxResolutionHours}h` },
          { key: 'active', header: 'Estado', render: (row) => row.active ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => openEdit(row)}><Settings2 className="h-4 w-4" />Editar</Button>
                <Button variant="ghost" onClick={() => setVersionsOpen(true)}><History className="h-4 w-4" />Versiones</Button>
              </div>
            )
          }
        ]}
      />

      <Modal isOpen={Boolean(editing)} title={editing?.id ? 'Editar SLA' : 'Nuevo SLA'} onClose={() => setEditing(null)}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(save)}>
          <FormInput register={form.register} name="name" label="Nombre" error={form.formState.errors.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput register={form.register} name="maxResponseHours" type="number" label="Max respuesta (horas)" error={form.formState.errors.maxResponseHours} />
            <FormInput register={form.register} name="maxResolutionHours" type="number" label="Max resolucion (horas)" error={form.formState.errors.maxResolutionHours} />
          </div>
          <FormInput register={form.register} name="scope" label="Alcance (prioridad / categoria / cliente)" error={form.formState.errors.scope} />
          {editing?.id && (
            <FormSelect
              register={form.register}
              name="changeScope"
              label="Alcance del cambio"
              error={form.formState.errors.changeScope}
              options={[
                { value: 'NEW_ONLY', label: 'Solo nuevos tickets' },
                { value: 'RECALCULATE_OPEN', label: 'Recalcular tickets abiertos' }
              ]}
            />
          )}
          <Button type="submit" isLoading={form.formState.isSubmitting}>Guardar SLA</Button>
        </form>
      </Modal>

      <Drawer isOpen={versionsOpen} title="Historial de versiones SLA" onClose={() => setVersionsOpen(false)}>
        <div className="grid gap-3">
          {slaVersions.map((version) => (
            <div key={version.id} className="rounded-lg border border-neutral-200 p-4">
              <p className="font-semibold text-neutral-900">Version {version.version}</p>
              <p className="text-sm text-neutral-500">{formatDate(version.changedAt)} por {version.changedBy}</p>
              <p className="mt-2 text-sm text-neutral-700">Respuesta {version.response}h · Resolucion {version.resolution}h</p>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};

export default SLAs;
