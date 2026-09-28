import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { confirmRegistrationAuthenticator, registerClient } from '../../services/auth.client.service.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import AuthenticatorSetup from '../../components/auth/AuthenticatorSetup.jsx';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { registerSchema } from '../../utils/validators.js';
import kollabLogo from '../../assets/kollab-logo.png';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [setup, setSetup] = useState(null);
  const [confirmation, setConfirmation] = useState({ password: '', code: '' });
  const [confirming, setConfirming] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', company: '' }
  });

  const onSubmit = async (values) => {
    try {
      const result = await registerClient(values);
      setSetup(result);
      showToast({ type: 'success', title: 'Cuenta creada', message: 'Vincula Google Authenticator con el código de configuración.' });
    } catch (error) {
      showToast({ type: 'error', title: 'No pudimos crear la cuenta', message: getErrorMessage(error) });
    }
  };

  const confirmSetup = async (event) => {
    event.preventDefault();
    setConfirming(true);
    try {
      await confirmRegistrationAuthenticator({ setupToken: setup.setupToken, ...confirmation });
      showToast({ type: 'success', title: 'Authenticator vinculado' });
      navigate('/login');
    } catch (error) {
      showToast({ type: 'error', title: 'No se pudo vincular', message: getErrorMessage(error) });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card className="border-neutral-200 bg-white p-8">
        <div className="text-center">
          <div className="mx-auto px-5 py-2">
            <img className="mx-auto h-auto w-48 max-w-full" src={kollabLogo} alt="Kollab Koncepts" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-neutral-700">Registra tu acceso como cliente.</p>
        </div>
        {!setup ? <form noValidate className="mt-8 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="Nombre" name="name" autoComplete="name" register={register} error={errors.name} />
          <FormInput label="Correo electronico" name="email" type="email" autoComplete="email" register={register} error={errors.email} />
          <FormInput label="Contrasena" name="password" type="password" autoComplete="new-password" register={register} error={errors.password} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Telefono" name="phone" register={register} error={errors.phone} />
            <FormInput label="Empresa" name="company" register={register} error={errors.company} />
          </div>
          <Button type="submit" isLoading={isSubmitting}>Registrarme</Button>
        </form> : <div className="mt-8 grid gap-4">
          <AuthenticatorSetup setupCode={setup.setupCode} setupUri={setup.setupUri} />
          <form noValidate className="grid gap-3" onSubmit={confirmSetup}>
            <FormInput label="Contraseña de la cuenta" name="setupPassword" type="password" autoComplete="new-password" register={() => ({ value: confirmation.password, onChange: (event) => setConfirmation((current) => ({ ...current, password: event.target.value })) })} />
            <label className="grid gap-1 text-sm font-medium text-neutral-700" htmlFor="setup-code">Código de Authenticator</label>
            <input id="setup-code" className="min-h-10 rounded-md border border-neutral-200 px-3" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={confirmation.code} onChange={(event) => setConfirmation((current) => ({ ...current, code: event.target.value.replace(/\D/g, '') }))} />
            <Button type="submit" disabled={!confirmation.password || !/^\d{6}$/.test(confirmation.code)} isLoading={confirming}>Vincular cuenta</Button>
          </form>
          <Button variant="ghost" onClick={() => navigate('/login')}>Configurar más tarde desde Perfil</Button>
        </div>}
        <p className="mt-6 text-center text-sm text-neutral-700">
          Ya tienes cuenta? <Link className="font-semibold text-primary-600 hover:text-primary-700" to="/login">Inicia sesion</Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;
