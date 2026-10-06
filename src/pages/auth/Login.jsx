import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import AuthenticatorSetup from '../../components/auth/AuthenticatorSetup.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { loginSchema } from '../../utils/validators.js';
import { ROLE_HOME } from '../../utils/constants.js';
import { sendLoginEmailCode } from '../../services/auth.client.service.js';
import kollabLogo from '../../assets/kollab-logo.png';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, completeLogin } = useAuth();
  const { showToast } = useToast();
  const [challenge, setChallenge] = useState(null);
  const [method, setMethod] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const enterSession = (session) => {
    const roleHome = ROLE_HOME[session.user?.role] || '/';
    const fromPath = location.state?.from?.pathname;
    navigate(fromPath?.startsWith(roleHome) ? fromPath : roleHome, { replace: true });
  };

  const onSubmit = async (values) => {
    try {
      const nextChallenge = await login(values);
      if (nextChallenge?.accessToken && nextChallenge?.user) {
        enterSession(nextChallenge);
        return;
      }
      if (!nextChallenge?.challengeId || !Array.isArray(nextChallenge.methods)) {
        throw new Error('El servidor todavía no tiene activa la verificación en dos pasos. Intenta de nuevo cuando termine el despliegue.');
      }
      setChallenge(nextChallenge);
      setMethod(nextChallenge.authenticatorSetup ? 'authenticator' : '');
      setCode('');
    } catch (error) {
      showToast({ type: 'error', title: 'No pudimos iniciar sesión', message: getErrorMessage(error, 'Revisa tus credenciales.') });
    }
  };

  const selectMethod = async (nextMethod) => {
    if (nextMethod === 'email') {
      setBusy(true);
      try {
        const result = await sendLoginEmailCode(challenge.challengeId);
        showToast({ type: 'success', title: 'Código enviado', message: `Enviado a ${result.destination}. El código vence en 10 minutos.` });
      } catch (error) {
        showToast({ type: 'error', title: 'No se pudo enviar el código', message: getErrorMessage(error) });
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setMethod(nextMethod);
    setCode('');
  };

  const verify = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return;
    setBusy(true);
    try {
      const session = await completeLogin({ challengeId: challenge.challengeId, method, code });
      enterSession(session);
    } catch (error) {
      showToast({ type: 'error', title: 'Código no válido', message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="border-neutral-200 bg-white p-8">
        <div className="text-center">
          <div className="mx-auto px-5 py-2">
            <img className="mx-auto h-auto w-56 max-w-full" src={kollabLogo} alt="Kollab Koncepts" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-neutral-900">Bienvenido al Sistema</h1>
          <p className="mt-1 text-sm text-neutral-700">Plataforma Digital de Reportes Tecnicos</p>
        </div>
        {!challenge ? <form noValidate className="mt-8 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="Correo electronico" name="email" type="email" autoComplete="email" register={register} error={errors.email} />
          <FormInput label="Contrasena" name="password" type="password" autoComplete="current-password" register={register} error={errors.password} />
          <div className="-mt-2 text-right">
            <Link className="text-sm font-semibold text-primary-600 hover:text-primary-700" to="/forgot-password">Olvide contrasena</Link>
          </div>
          <Button type="submit" isLoading={isSubmitting} className="bg-[#e5232b] hover:bg-[#cf1f27] focus:ring-primary-100">
            Iniciar Sesion
          </Button>
        </form> : <div className="mt-8 grid gap-4">
          <p className="text-sm text-neutral-700">Elige cómo confirmar tu identidad.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant={method === 'email' ? 'primary' : 'secondary'} onClick={() => selectMethod('email')} disabled={busy}>Código por correo</Button>
            {challenge.methods?.includes('authenticator') && <Button variant={method === 'authenticator' ? 'primary' : 'secondary'} onClick={() => selectMethod('authenticator')} disabled={busy}>{challenge.authenticatorSetup ? 'Vincular Authenticator' : 'Google Authenticator'}</Button>}
          </div>
          {method === 'authenticator' && challenge.authenticatorSetup && <AuthenticatorSetup {...challenge.authenticatorSetup} />}
          {method && <form noValidate className="grid gap-3" onSubmit={verify}>
            <label className="grid gap-1 text-sm font-medium text-neutral-700" htmlFor="login-code">Código de 6 dígitos</label>
            <input id="login-code" className="min-h-10 rounded-md border border-neutral-200 px-3" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
            <Button type="submit" disabled={!/^\d{6}$/.test(code)} isLoading={busy}>Verificar e ingresar</Button>
          </form>}
          <Button variant="ghost" onClick={() => { setChallenge(null); setMethod(''); setCode(''); }}>Volver a contraseña</Button>
        </div>}
        <p className="mt-6 text-center text-sm text-neutral-700">
          No tienes cuenta? <Link className="font-semibold text-primary-600 hover:text-primary-700" to="/register">Registrate</Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
