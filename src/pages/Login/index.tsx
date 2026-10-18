import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from '../../api/auth.api';
import { getErrorMessage } from '../../api/errors';
import { Rise } from '../../components/auth/Rise';
import { Button } from '../../components/common/Button';
import { PageTitle } from '../../components/common/PageTitle';
import { PasswordField, TextField } from '../../components/common/TextField';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema, type LoginValues } from '../../schemas/auth.schema';
import { isRecord } from '../../utils/normalize';

export default function LoginPage() {
  const { setToken } = useAuth();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // ProtectedRoute stores the page the visitor tried to open (e.g. a shared post link) in `state.from`.
  const state: unknown = location.state;
  const from = isRecord(state) && typeof state.from === 'string' ? state.from : null;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { token } = await signIn(values);
      setToken(token); // PublicRoute redirects (to `from` when present) once the profile has loaded
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not sign you in.'));
    }
  });

  return (
    <>
      <PageTitle title="Login" />
      <Rise index={0}>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">
          {from?.startsWith('/posts/') ? 'Log in to open the post you were sent.' : "Log in to see what's new."}
        </p>
      </Rise>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <Rise index={1}>
          <TextField
            label="Email or username"
            autoComplete="username"
            autoCapitalize="none"
            error={errors.identifier?.message}
            {...register('identifier')}
          />
        </Rise>
        <Rise index={2}>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </Rise>
        {formError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}
        <Rise index={3}>
          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:active:translate-y-0"
          >
            Log in
          </Button>
        </Rise>
      </form>

      <Rise index={4}>
        <p className="mt-6 text-center text-sm text-muted">
          New here?{' '}
          <Link
            to="/register"
            state={location.state}
            className="font-semibold text-brand-from hover:underline"
          >
            Create an account
          </Link>
        </p>
      </Rise>
    </>
  );
}
