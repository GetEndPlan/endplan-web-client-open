import { createAuthClient } from 'better-auth/react'
import type { User } from '@/entities/user'
import { AuthClientError, parseBetterAuthClientError } from '../model/auth-client-error'

// Use same origin when VITE_AUTH_URL is empty (nginx proxies /api/auth/*)
const authBaseURL = import.meta.env.VITE_AUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')

const authClient = createAuthClient({
  baseURL: authBaseURL,
  fetchOptions: {
    credentials: 'include',
  },
})

export type AuthResult = {
  user: User | null
  error: string | null
  errorCode: string | null
}

export type LoginParams = {
  email: string
  password: string
}

export type SignupParams = {
  email: string
  password: string
  name: string
  passwordHint?: string
}

export type ResetPasswordWithCodeParams = {
  email: string
  code: string
  newPassword: string
}

function mapUser(data: {
  id: string
  email: string
  name: string | null
  emailVerified?: boolean
}): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name || '',
    emailVerified: data.emailVerified ?? false,
    phone: undefined,
    country: undefined,
  }
}

export const authApi = {
  async getSession(): Promise<AuthResult> {
    try {
      const { data: session } = await authClient.getSession()
      if (session?.user) {
        return { user: mapUser(session.user), error: null, errorCode: null }
      }
      return { user: null, error: null, errorCode: null }
    } catch {
      return { user: null, error: null, errorCode: null }
    }
  },

  async login(params: LoginParams): Promise<AuthResult> {
    const { data, error } = await authClient.signIn.email({
      email: params.email,
      password: params.password,
    })

    if (error) {
      const parsed = parseBetterAuthClientError(error)
      return {
        user: null,
        error: parsed.message || 'Login failed',
        errorCode: parsed.code,
      }
    }

    if (data?.user) {
      return { user: mapUser(data.user), error: null, errorCode: null }
    }

    return { user: null, error: 'Login failed', errorCode: null }
  },

  async signup(params: SignupParams): Promise<AuthResult> {
    const { data, error } = await authClient.signUp.email({
      email: params.email,
      password: params.password,
      name: params.name,
      ...(params.passwordHint && { passwordHint: params.passwordHint }),
    })

    if (error) {
      const parsed = parseBetterAuthClientError(error)
      const message = parsed.message || 'Signup failed'
      const errorCode = parsed.code
      throw new AuthClientError(message, errorCode)
    }

    if (data?.user) {
      return { user: mapUser(data.user), error: null, errorCode: null }
    }

    throw new AuthClientError('Signup failed', null)
  },

  async logout(): Promise<void> {
    await authClient.signOut()
  },

  async resetPasswordWithCode(params: ResetPasswordWithCodeParams): Promise<void> {
    const res = await fetch(`${authBaseURL}/api/auth/reset-password-with-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: params.email,
        code: params.code,
        newPassword: params.newPassword,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error((data as { message?: string }).message || 'Failed to reset password')
    }
  },
}
