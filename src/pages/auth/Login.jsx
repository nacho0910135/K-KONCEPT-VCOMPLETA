import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { loginSchema } from '../../utils/validators.js';
import { ROLE_HOME } from '../../utils/constants.js';
import kollabLogo from '../../assets/kollab-logo.png';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (values) => {
    try {
      const session = await login(values);
      const roleHome = ROLE_HOME[session.user?.role] || '/';
      const fromPath = location.state?.from?.pathname;
      const destination = fromPath?.startsWith(roleHome) ? fromPath : roleHome;
      navigate(destination, { replace: true });
    } catch (error) {
      showToast({ type: 'error', title: 'No pudimos iniciar sesion', message: getErrorMessage(error, 'Revisa tus credenciales.') });
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
        <form className="mt-8 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="Correo electronico" name="email" type="email" autoComplete="email" register={register} error={errors.email} />
          <FormInput label="Contrasena" name="password" type="password" autoComplete="current-password" register={register} error={errors.password} />
          <div className="-mt-2 text-right">
            <Link className="text-sm font-semibold text-primary-600 hover:text-primary-700" to="/forgot-password">Olvide contrasena</Link>
          </div>
          <Button type="submit" isLoading={isSubmitting} className="bg-[#e5232b] hover:bg-[#cf1f27] focus:ring-primary-100">
            Iniciar Sesion
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-700">
          No tienes cuenta? <Link className="font-semibold text-primary-600 hover:text-primary-700" to="/register">Registrate</Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
