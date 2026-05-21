import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import MultiSelect from '../../components/forms/MultiSelect.jsx';
import { useToast } from '../../hooks/useToast.js';

const profileSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email invalido'),
  phone: z.string().min(8, 'Telefono requerido')
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Ingresa tu password actual'),
  newPassword: z.string().min(8, 'Minimo 8 caracteres')
});

const Perfil = () => {
  const { showToast } = useToast();
  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: 'Cliente Norte', email: 'soporte@norte.com', phone: '7000-1212' } });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '' } });
  const preferencesForm = useForm({ defaultValues: { channels: ['EMAIL', 'IN_APP'] } });
  const channels = preferencesForm.watch('channels');

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Perfil</h1>
        <p className="mt-1 text-sm text-neutral-500">Datos de usuario, seguridad y preferencias.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Datos del usuario</h2>
          <form className="mt-4 grid gap-4" onSubmit={profileForm.handleSubmit(() => showToast({ type: 'success', title: 'Perfil actualizado' }))}>
            <FormInput register={profileForm.register} name="name" label="Nombre" error={profileForm.formState.errors.name} />
            <FormInput register={profileForm.register} name="email" label="Email" error={profileForm.formState.errors.email} />
            <FormInput register={profileForm.register} name="phone" label="Telefono" error={profileForm.formState.errors.phone} />
            <Button type="submit">Guardar perfil</Button>
          </form>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Cambio de contrasena</h2>
          <form className="mt-4 grid gap-4" onSubmit={passwordForm.handleSubmit(() => { passwordForm.reset(); showToast({ type: 'success', title: 'Contrasena actualizada' }); })}>
            <FormInput register={passwordForm.register} name="currentPassword" type="password" label="Contrasena actual" error={passwordForm.formState.errors.currentPassword} />
            <FormInput register={passwordForm.register} name="newPassword" type="password" label="Nueva contrasena" error={passwordForm.formState.errors.newPassword} />
            <Button type="submit">Cambiar contrasena</Button>
          </form>
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Preferencias de notificacion</h2>
        <div className="mt-4">
          <MultiSelect
            label="Canales"
            value={channels}
            onChange={(value) => preferencesForm.setValue('channels', value)}
            options={[{ value: 'EMAIL', label: 'Email' }, { value: 'IN_APP', label: 'In app' }, { value: 'SMS', label: 'SMS' }, { value: 'PUSH', label: 'Push' }]}
          />
        </div>
      </Card>
    </div>
  );
};

export default Perfil;
