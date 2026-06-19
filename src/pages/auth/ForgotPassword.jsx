import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import { requestPasswordResetCode, resetPasswordWithCode } from '../../services/auth.client.service.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import { passwordResetRequestSchema, passwordResetSchema } from '../../utils/validators.js';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [codeSent, setCodeSent] = useState(false);
  const requestForm = useForm({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' }
  });
  const resetForm = useForm({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: '', code: '', password: '' }
  });

  const onRequestCode = async (values) => {
    try {
      await requestPasswordResetCode(values);
      resetForm.setValue('email', values.email);
      setCodeSent(true);
      showToast({
        type: 'success',
        title: 'Codigo enviado',
        message: 'Si el correo esta registrado, recibiras un codigo para restablecer tu contrasena.'
      });
    } catch (error) {
      showToast({ type: 'error', title: 'No pudimos enviar el codigo', message: getErrorMessage(error) });
    }
  };

  const onResetPassword = async (values) => {
    try {
      await resetPasswordWithCode(values);
      showToast({ type: 'success', title: 'Contrasena actualizada', message: 'Ya puedes iniciar sesion.' });
      navigate('/login');
    } catch (error) {
      showToast({ type: 'error', title: 'No pudimos restablecer la contrasena', message: getErrorMessage(error) });
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="border-neutral-200 bg-white p-8">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary-600 text-lg font-bold text-white">K</div>
          <h1 className="mt-5 text-2xl font-bold text-neutral-900">Restablecer contrasena</h1>
          <p className="mt-1 text-sm text-neutral-700">Solicita un codigo por correo y crea una nueva contrasena.</p>
        </div>

        {!codeSent ? (
          <form className="mt-8 grid gap-4" onSubmit={requestForm.handleSubmit(onRequestCode)}>
            <FormInput label="Correo electronico" name="email" type="email" autoComplete="email" register={requestForm.register} error={requestForm.formState.errors.email} />
            <Button type="submit" isLoading={requestForm.formState.isSubmitting}>
              Enviar codigo
            </Button>
          </form>
        ) : (
          <form className="mt-8 grid gap-4" onSubmit={resetForm.handleSubmit(onResetPassword)}>
            <FormInput label="Correo electronico" name="email" type="email" autoComplete="email" register={resetForm.register} error={resetForm.formState.errors.email} />
            <FormInput label="Codigo" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} register={resetForm.register} error={resetForm.formState.errors.code} />
            <FormInput label="Nueva contrasena" name="password" type="password" autoComplete="new-password" register={resetForm.register} error={resetForm.formState.errors.password} />
            <Button type="submit" isLoading={resetForm.formState.isSubmitting}>
              Restablecer contrasena
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                requestForm.reset({ email: resetForm.getValues('email') });
                resetForm.reset({ email: '', code: '', password: '' });
                setCodeSent(false);
              }}
            >
              Usar otro correo
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-700">
          Recordaste tu contrasena? <Link className="font-semibold text-primary-600 hover:text-primary-700" to="/login">Inicia sesion</Link>
        </p>
      </Card>
    </div>
  );
};

export default ForgotPassword;
