/** Auth API error codes returned by Better Auth / auth server. */
export const AUTH_ERROR_CODE = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
} as const

export type AuthErrorCode = (typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE]

export class AuthClientError extends Error {
  readonly code: string | null

  constructor(message: string, code: string | null = null) {
    super(message)
    this.name = 'AuthClientError'
    this.code = code
  }
}

function readStringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

/** Extract code/message from Better Auth client error objects. */
export function parseBetterAuthClientError(error: unknown): { code: string | null; message: string | null } {
  if (!error || typeof error !== 'object') {
    return { code: null, message: null }
  }

  const record = error as Record<string, unknown>
  const code = readStringField(record.code)
  const message = readStringField(record.message) ?? readStringField(record.error)

  return { code, message }
}

export function isAuthClientError(error: unknown): error is AuthClientError {
  return error instanceof AuthClientError
}
