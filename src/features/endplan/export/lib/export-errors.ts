import { ApiError } from '@/shared/api/client'

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.isNotFound
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  return error instanceof Error && error.name === 'AbortError'
}

export function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) return
  throw new DOMException('The operation was aborted.', 'AbortError')
}

export async function getOptionalResource<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load()
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}
