import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/client'
import { erasureApi } from '../erasure-api'
import type { ErasureKind, ErasureRequest } from '../../model/types'

export const erasureKeys = {
  all: ['erasure'] as const,
  requests: () => [...erasureKeys.all, 'requests'] as const,
}

export function useErasureRequestsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: erasureKeys.requests(),
    queryFn: () => erasureApi.list(),
    select: (data) => data.requests,
    enabled: options?.enabled ?? true,
  })
}

export function useScheduleErasureMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (kind: ErasureKind) => erasureApi.schedule(kind),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: erasureKeys.requests() })
    },
  })
}

export function useCancelErasureMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => erasureApi.cancel(requestId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: erasureKeys.requests() })
    },
  })
}

export function erasureApiMessage(error: unknown): string | undefined {
  if (error instanceof ApiError) {
    return error.apiMessage
  }
  return undefined
}

export function hasActiveErasureForKind(requests: ErasureRequest[] | undefined, kind: ErasureKind): boolean {
  if (!requests?.length) return false
  return requests.some(
    (r) => r.kind === kind && (r.status === 'scheduled' || r.status === 'processing'),
  )
}
