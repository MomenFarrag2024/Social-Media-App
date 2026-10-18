import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginValues = z.infer<typeof loginSchema>;

// ASSUMPTION: field set and rules mirror what this API family usually expects.
// Client rules are intentionally lenient; the server's validation messages are
// mapped back onto the matching fields.
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^\S+$/, 'Username cannot contain spaces'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    rePassword: z.string().min(1, 'Confirm your password'),
    dateOfBirth: z
      .string()
      .min(1, 'Select your date of birth')
      .refine((value) => !Number.isNaN(Date.parse(value)) && new Date(value) <= new Date(), 'Enter a valid date of birth'),
    gender: z.string().refine((value) => value === 'male' || value === 'female', 'Select a gender'),
  })
  .refine((values) => values.password === values.rePassword, {
    message: 'Passwords do not match',
    path: ['rePassword'],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    password: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((values) => values.password !== values.newPassword, {
    message: 'New password must be different from the current one',
    path: ['newPassword'],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
