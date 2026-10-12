import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trustedCircleKeys } from '@/features/trusted-circle/api'
import { billingApi } from '../billing-api'
import type { BillingTier } from '../billing-api'

export const billingKeys = {
  all: ['billing'] as const,
  products: () => [...billingKeys.all, 'products'] as const,
  subscription: () => [...billingKeys.all, 'subscription'] as const,
  portal: () => [...billingKeys.all, 'portal'] as const,
}

export function useBillingProducts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.products(),
    queryFn: () => billingApi.getProducts(),
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: options?.enabled ?? true,
  })
}

export function useSubscription(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: () => billingApi.getSubscription(),
    enabled: options?.enabled ?? true,
  })
}

export function useOpenPortal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => billingApi.getPortalUrl(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all })
    },
  })
}

export function useCreateCheckout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tier, interval }: { tier: BillingTier; interval: 'monthly' | 'yearly' }) =>
      billingApi.createCheckout(tier, interval),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all })
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => billingApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() })
      queryClient.invalidateQueries({ queryKey: billingKeys.all })
    },
  })
}

export function useAcknowledgeKeyPersonFree() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => billingApi.acknowledgeKeyPersonFree(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() })
      queryClient.invalidateQueries({ queryKey: billingKeys.all })
      queryClient.invalidateQueries({ queryKey: trustedCircleKeys.all })
    },
  })
}
