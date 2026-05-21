import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerClient } from '../../services/auth.client.service.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { registerSchema } from '../../utils/validators.js';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
      await registerClient(values);
      showToast({ type: 'success', title: 'Cuenta creada', message: 'Ya puedes iniciar sesion.' });
      navigate('/login');
    } catch (error) {
      showToast({ type: 'error', title: 'No pudimos crear la cuenta', message: getErrorMessage(error) });
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-lg gap-6">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary-600 text-lg font-bold text-white">K</div>
        <h1 className="mt-4 text-2xl font-bold text-neutral-900">Crear cuenta</h1>
        <p className="mt-1 text-sm text-neutral-500">Registra tu acceso como cliente.</p>
      </div>
      <Card className="p-6">
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="Nombre" name="name" autoComplete="name" register={register} error={errors.name} />
          <FormInput label="Correo electronico" name="email" type="email" autoComplete="email" register={register} error={errors.email} />
          <FormInput label="Contrasena" name="password" type="password" autoComplete="new-password" register={register} error={errors.password} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Telefono" name="phone" register={register} error={errors.phone} />
            <FormInput label="Empresa" name="company" register={register} error={errors.company} />
          </div>
          <Button type="submit" isLoading={isSubmitting}>Registrarme</Button>
        </form>
      </Card>
      <p className="text-center text-sm text-neutral-600">
        Ya tienes cuenta? <Link className="font-semibold text-primary-600 hover:text-primary-700" to="/login">Inicia sesion</Link>
      </p>
    </div>
  );
};

export default Register;
