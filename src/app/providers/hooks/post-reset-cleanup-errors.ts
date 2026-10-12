import { ApiError } from '@/shared/api'

export function shouldSuppressPostResetCleanupError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
}
