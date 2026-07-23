import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { updateMyProfile } from '../../services/users.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const profileSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  avatarUrl: z.string().optional()
});

const imageToThumbnail = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
    const image = new Image();
    image.onerror = reject;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const Perfil = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: '', phone: '', company: '', avatarUrl: '' } });

  useEffect(() => {
    profileForm.reset({
      name: user?.name || '',
      phone: user?.phone || '',
      company: user?.company || '',
      avatarUrl: user?.avatarUrl || ''
    });
    setAvatarPreview(user?.avatarUrl || '');
  }, [profileForm, user]);

  const selectAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast({ type: 'error', title: 'Imagen invalida', message: 'Selecciona un archivo de imagen.' });
      return;
    }
    const thumbnail = await imageToThumbnail(file);
    profileForm.setValue('avatarUrl', thumbnail, { shouldDirty: true });
    setAvatarPreview(thumbnail);
  };

  const saveProfile = async (values) => {
    try {
      await updateMyProfile(values);
      await refreshUser();
      showToast({ type: 'success', title: 'Perfil actualizado' });
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudo guardar', message: getErrorMessage(error) });
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Perfil</h1>
        <p className="mt-1 text-sm text-neutral-500">Datos visibles, contacto y miniatura de usuario.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card className="grid place-items-center p-6 text-center">
          <div className="relative">
            {avatarPreview ? (
              <img className="h-32 w-32 rounded-full object-cover ring-4 ring-primary-100" src={avatarPreview} alt={user?.name || 'Usuario'} />
            ) : (
              <span className="grid h-32 w-32 place-items-center rounded-full bg-primary-50 text-primary-700 ring-4 ring-primary-100">
                <UserRound className="h-14 w-14" />
              </span>
            )}
            <label className="absolute bottom-1 right-1 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-primary-600 text-white shadow-soft transition hover:bg-primary-700" aria-label="Cambiar miniatura">
              <Camera className="h-5 w-5" />
              <input className="sr-only" type="file" accept="image/*" onChange={selectAvatar} />
            </label>
          </div>
          <h2 className="mt-4 font-semibold text-neutral-900">{user?.name}</h2>
          <p className="text-sm text-neutral-500">{user?.email}</p>
          <p className="mt-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">{user?.role}</p>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Datos del usuario</h2>
          <form className="mt-4 grid gap-4" onSubmit={profileForm.handleSubmit(saveProfile)}>
            <FormInput register={profileForm.register} name="name" label="Nombre" error={profileForm.formState.errors.name} />
            <FormInput register={() => ({ value: user?.email || '', readOnly: true })} name="email" label="Correo electronico" />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput register={profileForm.register} name="phone" label="Telefono" error={profileForm.formState.errors.phone} />
              <FormInput register={profileForm.register} name="company" label="Empresa" error={profileForm.formState.errors.company} />
            </div>
            <input type="hidden" {...profileForm.register('avatarUrl')} />
            <Button type="submit" isLoading={profileForm.formState.isSubmitting}>Guardar perfil</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Perfil;
