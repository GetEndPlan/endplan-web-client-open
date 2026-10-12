import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keysApi } from '../keys-api'
import type { CreateUserKeysRequest } from '../keys-api'

export const keysKeys = {
  all: ['keys'] as const,
  mine: () => [...keysKeys.all, 'mine'] as const,
  public: (userId: string) => [...keysKeys.all, 'public', userId] as const,
}

export function useKeys(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: keysKeys.mine(),
    queryFn: () => keysApi.getMyKeys(),
    enabled: options?.enabled ?? true,
  })
}

export function usePublicKey(userId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: keysKeys.public(userId ?? ''),
    queryFn: () => keysApi.getPublicKey(userId!),
    enabled: !!userId && (options?.enabled ?? true),
  })
}

export function useCreateKeys() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserKeysRequest) => keysApi.createKeys(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keysKeys.all })
    },
  })
}

export function useRotateKeys() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserKeysRequest) => keysApi.rotateKeys(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keysKeys.all })
    },
  })
}
