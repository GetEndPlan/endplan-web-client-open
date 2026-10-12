import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../profile-api'
import type { UpdateProfileParams, UserOnboardingState } from '../profile-api'
import { livenessApi, type UpdateLivenessParams } from '../liveness-api'

export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  onboarding: () => [...userKeys.all, 'onboarding'] as const,
  liveness: () => [...userKeys.all, 'liveness'] as const,
}

export function useProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => profileApi.getProfile(),
    enabled: options?.enabled ?? true,
  })
}

export function usePatchOnboardingState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      dashboardWelcomeDismissed?: boolean
      dashboardWelcomeIntroAcknowledged?: boolean
      dashboardNavTourSettled?: boolean
      recoveryPhraseOnboardingCompleted?: boolean
      recoveryPhraseOnboardingDeferredUntil?: string | null
      scheduledAccountDeletionWelcomeDismissed?: boolean
      clearTrialPlanBadgeDismissed?: boolean
      trialPlanBadgeDismissedKey?: string
    }) => profileApi.patchOnboardingState(params),
    onSuccess: (onboarding) => {
      queryClient.setQueryData<UserOnboardingState>(userKeys.onboarding(), onboarding)
      queryClient.setQueryData(userKeys.profile(), (current: Awaited<ReturnType<typeof profileApi.getProfile>> | undefined) => {
        if (!current) {
          return { user: null, onboarding }
        }
        return { ...current, onboarding }
      })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: UpdateProfileParams) => profileApi.updateProfile(params),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.profile(), (current: Awaited<ReturnType<typeof profileApi.getProfile>> | undefined) => {
        if (!current) {
          return null
        }
        return { ...current, user }
      })
    },
  })
}

export function useUploadProfileAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadProfileAvatar(file),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.profile(), (current: Awaited<ReturnType<typeof profileApi.getProfile>> | undefined) => {
        if (!current) {
          return null
        }
        return { ...current, user }
      })
    },
  })
}

export function useLiveness(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.liveness(),
    queryFn: () => livenessApi.getLiveness(),
    enabled: options?.enabled ?? true,
  })
}

export function useUpdateLiveness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: UpdateLivenessParams) => livenessApi.updateLiveness(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.liveness() })
    },
  })
}
