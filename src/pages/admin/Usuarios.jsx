import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, ShieldAlert, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Modal from '../../components/common/Modal.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormSelect from '../../components/forms/FormSelect.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { RoleBadge, roleLabel, simulateAction } from './adminUtils.jsx';
import { users } from './adminMockData.js';

const userSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Correo invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional()
});

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'TECHNICIAN', 'CLIENT'], { required_error: 'Selecciona un rol' }),
  confirmation: z.string().refine((value) => value === 'CAMBIAR ROL', 'Escribe CAMBIAR ROL para confirmar')
});

const Usuarios = () => {
  const { data, setData, isLoading, error } = useAdminResource(() => users, []);
  const [filters, setFilters] = useState({ role: '', active: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [creatingTech, setCreatingTech] = useState(false);
  const [toggleUser, setToggleUser] = useState(null);
  const [roleUser, setRoleUser] = useState(null);
  const { showToast } = useToast();

  const userForm = useForm({ resolver: zodResolver(userSchema), defaultValues: { name: '', email: '', password: '', phone: '', company: '' } });
  const roleForm = useForm({ resolver: zodResolver(roleSchema), defaultValues: { role: 'TECHNICIAN', confirmation: '' } });

  const openEdit = (user) => {
    setEditingUser(user);
    userForm.reset({ name: user.name, email: user.email, password: '', phone: user.phone || '', company: user.company || '' });
  };

  const openCreate = () => {
    setCreatingTech(true);
    userForm.reset({ name: '', email: '', password: '', phone: '', company: 'Kollab Koncepts' });
  };

  const filteredUsers = (data || []).filter((user) => (
    (!filters.role || user.role === filters.role)
    && (!filters.active || String(user.active) === filters.active)
  ));

  const saveUser = async (values) => {
    await simulateAction();
    if (editingUser) {
      setData((current) => current.map((user) => user.id === editingUser.id ? { ...user, ...values } : user));
      setEditingUser(null);
      showToast({ type: 'success', title: 'Usuario actualizado' });
      return;
    }

    setData((current) => [{ id: crypto.randomUUID(), ...values, role: 'TECHNICIAN', active: true }, ...current]);
    setCreatingTech(false);
    showToast({ type: 'success', title: 'Tecnico creado', message: values.email });
  };

  const confirmToggle = async () => {
    await simulateAction();
    setData((current) => current.map((user) => user.id === toggleUser.id ? { ...user, active: !user.active } : user));
    showToast({ type: 'success', title: toggleUser.active ? 'Usuario desactivado' : 'Usuario activado' });
    setToggleUser(null);
  };

  const changeRole = async ({ role }) => {
    await simulateAction();
    setData((current) => current.map((user) => user.id === roleUser.id ? { ...user, role } : user));
    showToast({ type: 'warning', title: 'Rol cambiado', message: `${roleUser.email} ahora es ${roleLabel[role] || role}.` });
    setRoleUser(null);
    roleForm.reset();
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestion de usuarios</h1>
          <p className="mt-1 text-sm text-neutral-500">Administradores, tecnicos, clientes y permisos.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />Crear tecnico</Button>
      </div>

      <Card className="grid gap-3 p-4 md:grid-cols-2">
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
          <option value="">Todos los roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="TECHNICIAN">Tecnico</option>
          <option value="CLIENT">Cliente</option>
        </select>
        <select className="rounded-md border border-neutral-200 px-3 py-2 text-sm" value={filters.active} onChange={(event) => setFilters({ ...filters, active: event.target.value })}>
          <option value="">Activos e inactivos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </Card>

      <DataTable
        data={filteredUsers}
        loading={isLoading}
        error={error}
        searchPlaceholder="Buscar por nombre o correo"
        columns={[
          { key: 'name', header: 'Nombre', sortable: true },
          { key: 'email', header: 'Correo', sortable: true },
          { key: 'role', header: 'Rol', render: (row) => <RoleBadge value={row.role} /> },
          { key: 'active', header: 'Estado', render: (row) => row.active ? 'Activo' : 'Inactivo' },
          { key: 'company', header: 'Empresa' },
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => openEdit(row)}><Edit className="h-4 w-4" />Editar</Button>
                <Button variant="ghost" onClick={() => setToggleUser(row)}><ToggleLeft className="h-4 w-4" />{row.active ? 'Desactivar' : 'Activar'}</Button>
                <Button variant="ghost" onClick={() => setRoleUser(row)}><ShieldAlert className="h-4 w-4" />Rol</Button>
              </div>
            )
          }
        ]}
      />

      <Modal isOpen={creatingTech || Boolean(editingUser)} title={editingUser ? 'Editar usuario' : 'Crear tecnico'} onClose={() => { setCreatingTech(false); setEditingUser(null); }}>
        <form className="grid gap-4" onSubmit={userForm.handleSubmit(saveUser)}>
          <FormInput register={userForm.register} name="name" label="Nombre" error={userForm.formState.errors.name} />
          <FormInput register={userForm.register} name="email" label="Correo electronico" error={userForm.formState.errors.email} />
          <FormInput register={userForm.register} name="password" type="password" label="Contrasena inicial" error={userForm.formState.errors.password} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput register={userForm.register} name="phone" label="Telefono" error={userForm.formState.errors.phone} />
            <FormInput register={userForm.register} name="company" label="Empresa" error={userForm.formState.errors.company} />
          </div>
          <Button type="submit" isLoading={userForm.formState.isSubmitting}>Guardar</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(toggleUser)}
        title={toggleUser?.active ? 'Desactivar usuario' : 'Activar usuario'}
        message={`Confirma la accion para ${toggleUser?.email}.`}
        onCancel={() => setToggleUser(null)}
        onConfirm={confirmToggle}
      />

      <Modal isOpen={Boolean(roleUser)} title="Cambiar rol con doble confirmacion" onClose={() => setRoleUser(null)}>
        <form className="grid gap-4" onSubmit={roleForm.handleSubmit(changeRole)}>
          <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">Esta accion cambia permisos sensibles. Confirma el nuevo rol y escribe CAMBIAR ROL.</p>
          <FormSelect register={roleForm.register} name="role" label="Nuevo rol" error={roleForm.formState.errors.role} options={[{ value: 'ADMIN', label: 'Administrador' }, { value: 'TECHNICIAN', label: 'Tecnico' }, { value: 'CLIENT', label: 'Cliente' }]} />
          <FormInput register={roleForm.register} name="confirmation" label="Confirmacion" error={roleForm.formState.errors.confirmation} />
          <Button variant="danger" type="submit" isLoading={roleForm.formState.isSubmitting}>Cambiar rol</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Usuarios;
