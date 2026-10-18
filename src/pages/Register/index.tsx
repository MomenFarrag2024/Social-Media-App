import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUp } from '../../api/auth.api';
import { Rise } from '../../components/auth/Rise';
import { Button } from '../../components/common/Button';
import { PageTitle } from '../../components/common/PageTitle';
import { PasswordField, SelectField, TextField } from '../../components/common/TextField';
import { useAuth } from '../../hooks/useAuth';
import type { z } from 'zod';
import { registerSchema } from '../../schemas/auth.schema';
import { applyApiErrors } from '../../utils/formErrors';

export default function RegisterPage() {
  const { setToken } = useAuth();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<
  z.input<typeof registerSchema>,
  any,
  z.output<typeof registerSchema>
>({
  resolver: zodResolver(registerSchema),
  defaultValues: {
    gender: '',
  },
});

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { token } = await signUp(values);
      setToken(token); // PublicRoute then sends the new user to `state.from` (e.g. the shared post) or Home
    } catch (error) {
      // Duplicate accounts and other server validation errors are mapped onto fields when possible.
      setFormError(
        applyApiErrors(error, setError, ['rePassword', 'password', 'username', 'email', 'name', 'gender']),
      );
    }
  });

  return (
    <>
      <PageTitle title="Register" />
      <Rise index={0}>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Join and start sharing.</p>
      </Rise>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <Rise index={1}>
          <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        </Rise>
        <Rise index={2}>
          <TextField
            label="Username"
            autoComplete="username"
            autoCapitalize="none"
            error={errors.username?.message}
            {...register('username')}
          />
        </Rise>
        <Rise index={3}>
          <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        </Rise>
        <Rise index={4} className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Date of birth"
            type="date"
            autoComplete="bday"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
          <SelectField label="Gender" error={errors.gender?.message} {...register('gender')}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </SelectField>
        </Rise>
        <Rise index={5}>
          <PasswordField
            label="Password"
            autoComplete="new-password"
            hint="At least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
        </Rise>
        <Rise index={6}>
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            error={errors.rePassword?.message}
            {...register('rePassword')}
          />
        </Rise>
        {formError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}
        <Rise index={7}>
          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:active:translate-y-0"
          >
            Sign up
          </Button>
        </Rise>
      </form>

      <Rise index={8}>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-brand-from hover:underline">
            Log in
          </Link>
        </p>
      </Rise>
    </>
  );
}
