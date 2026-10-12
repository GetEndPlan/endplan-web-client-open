import { z } from 'zod'

/** Minimum length for signup / reset password (must match UI hints). */
export const PASSWORD_MIN_LENGTH = 8

/** Same rules as signup schema: length, one uppercase, one non-alphanumeric. */
export function meetsPasswordPolicy(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  )
}

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(PASSWORD_MIN_LENGTH, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  passwordHint: z.string().max(500).optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
