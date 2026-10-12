// Use same origin when VITE_API_URL is empty (nginx proxies /api/v1/*)
const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080')
let requestsBlocked = false

/** Mutating paths blocked after subscription_required so expired users stay read-only. */
const BLOCKED_WHEN_SUBSCRIPTION_ENDED_PREFIXES = [
  '/api/v1/vaults',
  '/api/v1/sections',
  '/api/v1/trusted-circle',
  '/api/v1/invitations',
  '/api/v1/release',
]

/** Invitees may accept/decline received invitations without an active subscription. */
function isInvitationInviteeResponsePath(path: string, method: RequestOptions['method']): boolean {
  if (method !== 'POST') {
    return false
  }
  return /^\/api\/v1\/invitations\/[^/]+\/(accept|decline)$/.test(path)
}

function isBlockedApiPathWhenSubscriptionEnded(endpoint: string, method: RequestOptions['method']): boolean {
  if (method === 'GET') {
    return false
  }
  const path = endpoint.split('?')[0]
  if (isInvitationInviteeResponsePath(path, method)) {
    return false
  }
  if (method === 'PATCH' && path === '/api/v1/user/liveness') {
    return true
  }
  return BLOCKED_WHEN_SUBSCRIPTION_ENDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function setApiRequestsBlocked(blocked: boolean) {
  requestsBlocked = blocked
}

export function areApiRequestsBlocked() {
  return requestsBlocked
}

export class ApiRequestsBlockedError extends Error {
  constructor() {
    super('API requests are blocked after subscription ended')
    this.name = 'ApiRequestsBlockedError'
  }
}

export class ApiError extends Error {
  status: number
  statusText: string
  data?: unknown

  constructor(status: number, statusText: string, data?: unknown) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isNotFound() {
    return this.status === 404
  }

  get isServerError() {
    return this.status >= 500
  }

  /** True when API returned 403 with code "limit_reached" (subscription limit) */
  get isLimitReached(): boolean {
    return this.status === 403 && this.data != null && typeof this.data === 'object' && 'code' in this.data && (this.data as { code: string }).code === 'limit_reached'
  }

  /** True when API returned 403 with code "subscription_required". */
  get isSubscriptionRequired(): boolean {
    return this.status === 403 && this.data != null && typeof this.data === 'object' && 'code' in this.data && (this.data as { code: string }).code === 'subscription_required'
  }

  /** Human-readable message from API body when present */
  get apiMessage(): string | undefined {
    if (this.data != null && typeof this.data === 'object' && 'message' in this.data && typeof (this.data as { message: unknown }).message === 'string') {
      return (this.data as { message: string }).message
    }
    return undefined
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options

  if (requestsBlocked && isBlockedApiPathWhenSubscriptionEnded(endpoint, method)) {
    throw new ApiRequestsBlockedError()
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
    signal,
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  if (!response.ok) {
    const errorData = isJson ? await response.json().catch(() => null) : null
    const err = new ApiError(response.status, response.statusText, errorData)
    // Once API confirms entitlement is required, stop non-billing API calls globally.
    if (err.isSubscriptionRequired) {
      requestsBlocked = true
    }
    throw err
  }

  if (response.status === 204) {
    return {} as T
  }

  return isJson ? response.json() : ({} as T)
}

/** POST multipart/form-data (e.g. file upload). Do not set Content-Type; the browser sets the boundary. */
export async function postMultipart<T>(endpoint: string, formData: FormData, options?: { signal?: AbortSignal }): Promise<T> {
  if (requestsBlocked && isBlockedApiPathWhenSubscriptionEnded(endpoint, 'POST')) {
    throw new ApiRequestsBlockedError()
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    signal: options?.signal,
  })

  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  if (!response.ok) {
    const errorData = isJson ? await response.json().catch(() => null) : null
    const err = new ApiError(response.status, response.statusText, errorData)
    if (err.isSubscriptionRequired) {
      requestsBlocked = true
    }
    throw err
  }

  if (response.status === 204) {
    return {} as T
  }

  return isJson ? response.json() : ({} as T)
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}
