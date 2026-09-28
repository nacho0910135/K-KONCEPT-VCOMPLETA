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
import { beginAuthenticatorSetup, changePassword, confirmAuthenticatorSetup, getAuthenticatorStatus } from '../../services/auth.client.service.js';
import { updateMyProfile } from '../../services/users.service.js';
import { getErrorMessage } from '../../utils/errorHandler.js';

const profileSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Ingresa un correo válido'),
  currentPassword: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  avatarUrl: z.string().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Contrasena actual requerida'),
  newPassword: z
    .string()
    .min(8, 'Minimo 8 caracteres')
    .regex(/[A-Z]/, 'Incluye al menos una mayuscula')
    .regex(/[0-9]/, 'Incluye al menos un numero'),
  confirmPassword: z.string().min(1, 'Confirma la nueva contrasena')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword']
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contrasena debe ser diferente',
  path: ['newPassword']
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
  const [authenticatorEnabled, setAuthenticatorEnabled] = useState(false);
  const [authenticatorSetup, setAuthenticatorSetup] = useState(null);
  const [authenticatorPassword, setAuthenticatorPassword] = useState('');
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [authenticatorBusy, setAuthenticatorBusy] = useState(false);
  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: '', email: '', currentPassword: '', phone: '', company: '', avatarUrl: '' } });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  useEffect(() => {
    getAuthenticatorStatus().then((result) => setAuthenticatorEnabled(result.enabled)).catch(() => {});
  }, []);

  useEffect(() => {
    profileForm.reset({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
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
      if (values.email.trim().toLowerCase() !== user?.email && !values.currentPassword) {
        profileForm.setError('currentPassword', { message: 'Ingresa tu contraseña actual para cambiar el correo' });
        return;
      }
      await updateMyProfile(values);
      await refreshUser();
      showToast({ type: 'success', title: 'Perfil actualizado' });
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudo guardar', message: getErrorMessage(error) });
    }
  };

  const savePassword = async ({ currentPassword, newPassword }) => {
    try {
      await changePassword({ currentPassword, newPassword });
      passwordForm.reset();
      showToast({ type: 'success', title: 'Contrasena actualizada' });
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudo cambiar', message: getErrorMessage(error) });
    }
  };

  const startAuthenticator = async () => {
    setAuthenticatorBusy(true);
    try {
      const result = await beginAuthenticatorSetup(authenticatorPassword);
      setAuthenticatorSetup(result);
      setAuthenticatorCode('');
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudo generar el código', message: getErrorMessage(error) });
    } finally {
      setAuthenticatorBusy(false);
    }
  };

  const confirmAuthenticator = async () => {
    setAuthenticatorBusy(true);
    try {
      await confirmAuthenticatorSetup({ currentPassword: authenticatorPassword, code: authenticatorCode });
      setAuthenticatorEnabled(true);
      setAuthenticatorSetup(null);
      setAuthenticatorPassword('');
      setAuthenticatorCode('');
      showToast({ type: 'success', title: 'Google Authenticator vinculado' });
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudo vincular', message: getErrorMessage(error) });
    } finally {
      setAuthenticatorBusy(false);
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
          <p className="break-all text-sm text-neutral-500">{user?.email}</p>
          <p className="mt-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">{user?.role}</p>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Datos del usuario</h2>
          <form noValidate className="mt-4 grid gap-4" onSubmit={profileForm.handleSubmit(saveProfile)}>
            <FormInput register={profileForm.register} name="name" label="Nombre" error={profileForm.formState.errors.name} />
            <FormInput register={profileForm.register} name="email" type="email" autoComplete="email" label="Correo electrónico" error={profileForm.formState.errors.email} />
            {profileForm.watch('email')?.trim().toLowerCase() !== user?.email && <FormInput register={profileForm.register} name="currentPassword" type="password" autoComplete="current-password" label="Contraseña actual para cambiar el correo" error={profileForm.formState.errors.currentPassword} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput register={profileForm.register} name="phone" label="Telefono" error={profileForm.formState.errors.phone} />
              <FormInput register={profileForm.register} name="company" label="Empresa" error={profileForm.formState.errors.company} />
            </div>
            <input type="hidden" {...profileForm.register('avatarUrl')} />
            <Button className="w-full sm:w-auto" type="submit" isLoading={profileForm.formState.isSubmitting}>Guardar perfil</Button>
          </form>
        </Card>

        <Card className="p-5 xl:col-start-2">
          <h2 className="text-sm font-semibold text-neutral-900">Cambiar contrasena</h2>
          <form noValidate className="mt-4 grid gap-4" onSubmit={passwordForm.handleSubmit(savePassword)}>
            <FormInput register={passwordForm.register} name="currentPassword" type="password" autoComplete="current-password" label="Contrasena actual" error={passwordForm.formState.errors.currentPassword} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput register={passwordForm.register} name="newPassword" type="password" autoComplete="new-password" label="Nueva contrasena" error={passwordForm.formState.errors.newPassword} />
              <FormInput register={passwordForm.register} name="confirmPassword" type="password" autoComplete="new-password" label="Confirmar contrasena" error={passwordForm.formState.errors.confirmPassword} />
            </div>
            <Button className="w-full sm:w-auto" type="submit" isLoading={passwordForm.formState.isSubmitting}>Cambiar contrasena</Button>
          </form>
        </Card>
        <Card className="p-5 xl:col-start-2">
          <h2 className="text-sm font-semibold text-neutral-900">Google Authenticator</h2>
          <p className="mt-2 text-sm text-neutral-600">{authenticatorEnabled ? 'Vinculado. Puedes usar sus códigos al iniciar sesión o seguir usando un código por correo.' : 'Vincúlalo para elegir códigos de la app al iniciar sesión. El código por correo ya está disponible.'}</p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-neutral-700" htmlFor="authenticator-password">Contraseña actual</label>
            <input id="authenticator-password" type="password" autoComplete="current-password" className="min-h-10 rounded-md border border-neutral-200 px-3" value={authenticatorPassword} onChange={(event) => setAuthenticatorPassword(event.target.value)} />
            {!authenticatorSetup ? <Button onClick={startAuthenticator} disabled={!authenticatorPassword} isLoading={authenticatorBusy}>{authenticatorEnabled ? 'Generar nueva clave' : 'Generar clave de configuración'}</Button> : <>
              <p className="text-sm text-neutral-700">En Google Authenticator, agrega una cuenta con clave de configuración e ingresa:</p>
              <code className="break-all rounded-md bg-neutral-100 p-3 text-center text-base font-bold tracking-widest">{authenticatorSetup.setupCode}</code>
              <p className="text-xs text-neutral-500">La clave actual seguirá funcionando hasta que confirmes la nueva.</p>
              <label className="grid gap-1 text-sm font-medium text-neutral-700" htmlFor="authenticator-code">Código de 6 dígitos de la app</label>
              <input id="authenticator-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="min-h-10 rounded-md border border-neutral-200 px-3" value={authenticatorCode} onChange={(event) => setAuthenticatorCode(event.target.value.replace(/\D/g, ''))} />
              <Button onClick={confirmAuthenticator} disabled={!/^\d{6}$/.test(authenticatorCode)} isLoading={authenticatorBusy}>Confirmar vinculación</Button>
            </>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Perfil;
