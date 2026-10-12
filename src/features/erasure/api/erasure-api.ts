import { api } from '@/shared/api/client'
import type { ErasureKind, ErasureListResponse, ErasureScheduleResponse } from '../model/types'

export const erasureApi = {
  async list(): Promise<ErasureListResponse> {
    return api.get<ErasureListResponse>('/api/v1/user/erasure-requests')
  },

  async schedule(kind: ErasureKind, options?: { signal?: AbortSignal }): Promise<ErasureScheduleResponse> {
    return api.post<ErasureScheduleResponse>(
      '/api/v1/user/erasure-requests',
      { kind },
      { signal: options?.signal },
    )
  },

  async cancel(requestId: string, options?: { signal?: AbortSignal }): Promise<void> {
    await api.post<unknown>(`/api/v1/user/erasure-requests/${encodeURIComponent(requestId)}/cancel`, undefined, {
      signal: options?.signal,
    })
  },

}
