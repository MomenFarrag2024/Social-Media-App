import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useChangePassword } from '../../hooks/useProfile';
import { changePasswordSchema, type ChangePasswordValues } from '../../schemas/auth.schema';
import { applyApiErrors } from '../../utils/formErrors';
import { Button } from '../common/Button';
import { PasswordField } from '../common/TextField';

export function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async ({ password, newPassword }) => {
    setFormError(null);
    try {
      await changePassword.mutateAsync({ password, newPassword });
      reset();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ['newPassword', 'password']));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label="Change password">
      <PasswordField
        label="Current password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        label="New password"
        autoComplete="new-password"
        hint="At least 8 characters"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <PasswordField
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" loading={changePassword.isPending}>
        Update password
      </Button>
    </form>
  );
}
