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
      const destination = location.state?.from?.pathname || ROLE_HOME[session.user?.role] || '/';
      navigate(destination, { replace: true });
    } catch (error) {
      showToast({ type: 'error', title: 'No pudimos iniciar sesion', message: getErrorMessage(error, 'Revisa tus credenciales.') });
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary-600 text-lg font-bold text-white">K</div>
        <h1 className="mt-4 text-2xl font-bold text-neutral-900">Iniciar sesion</h1>
        <p className="mt-1 text-sm text-neutral-500">Accede a la plataforma de reportes tecnicos.</p>
      </div>
      <Card className="p-6">
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="Email" name="email" type="email" autoComplete="email" register={register} error={errors.email} />
          <FormInput label="Contrasena" name="password" type="password" autoComplete="current-password" register={register} error={errors.password} />
          <Button type="submit" isLoading={isSubmitting}>Entrar</Button>
        </form>
      </Card>
      <p className="text-center text-sm text-neutral-600">
        No tienes cuenta? <Link className="font-semibold text-primary-600 hover:text-primary-700" to="/register">Registrate</Link>
      </p>
    </div>
  );
};

export default Login;
