import { api, postMultipart } from '@/shared/api/client'
import type { User } from '@/entities/user'

export type UserOnboardingState = {
  dashboardWelcomeDismissed: boolean
  dashboardWelcomeIntroAcknowledged: boolean
  dashboardNavTourSettled: boolean
  recoveryPhraseOnboardingCompleted: boolean
  recoveryPhraseOnboardingDeferredUntil?: string | null
  scheduledAccountDeletionWelcomeDismissed: boolean
  trialPlanBadgeDismissedKey?: string | null
}

type ProfileResponse = {
  user: {
    id: string
    email: string
    name: string
    emailVerified: boolean
    phone?: string | null
    country?: string | null
    imageUrl?: string | null
  }
  onboarding?: UserOnboardingState
}

type PatchOnboardingStateRequest = {
  dashboardWelcomeDismissed?: boolean
  dashboardWelcomeIntroAcknowledged?: boolean
  dashboardNavTourSettled?: boolean
  recoveryPhraseOnboardingCompleted?: boolean
  recoveryPhraseOnboardingDeferredUntil?: string | null
  scheduledAccountDeletionWelcomeDismissed?: boolean
  clearTrialPlanBadgeDismissed?: boolean
  trialPlanBadgeDismissedKey?: string
}

type PatchOnboardingStateResponse = {
  onboarding: UserOnboardingState
}

function mapUser(data: ProfileResponse['user']): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name ?? '',
    emailVerified: data.emailVerified ?? false,
    phone: data.phone ?? undefined,
    country: data.country ?? undefined,
    imageUrl: data.imageUrl ?? undefined,
  }
}

function normalizeOnboardingState(state?: UserOnboardingState | null): UserOnboardingState {
  return {
    dashboardWelcomeDismissed: state?.dashboardWelcomeDismissed ?? false,
    dashboardWelcomeIntroAcknowledged: state?.dashboardWelcomeIntroAcknowledged ?? false,
    dashboardNavTourSettled: state?.dashboardNavTourSettled ?? false,
    recoveryPhraseOnboardingCompleted: state?.recoveryPhraseOnboardingCompleted ?? false,
    recoveryPhraseOnboardingDeferredUntil: state?.recoveryPhraseOnboardingDeferredUntil ?? null,
    scheduledAccountDeletionWelcomeDismissed: state?.scheduledAccountDeletionWelcomeDismissed ?? false,
    trialPlanBadgeDismissedKey: state?.trialPlanBadgeDismissedKey ?? null,
  }
}

export type UpdateProfileParams = {
  name?: string
  phone?: string
  country?: string
}

export type EnsurePostResetCleanupResponse = {
  ok: boolean
  cleanupRun?: boolean
}

export type ProfileBundle = {
  user: User | null
  onboarding: UserOnboardingState
}

export const profileApi = {
  async getProfile(): Promise<ProfileBundle> {
    const res = await api.get<ProfileResponse>('/api/v1/user/profile')
    return {
      user: res?.user ? mapUser(res.user) : null,
      onboarding: normalizeOnboardingState(res?.onboarding),
    }
  },

  async updateProfile(params: UpdateProfileParams): Promise<User> {
    const res = await api.patch<ProfileResponse>('/api/v1/user/profile', params)
    if (!res?.user) throw new Error('Invalid profile response')
    return mapUser(res.user)
  },

  async uploadProfileAvatar(file: File, options?: { signal?: AbortSignal }): Promise<User> {
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await postMultipart<ProfileResponse>('/api/v1/user/profile/avatar', formData, options)
    if (!res?.user) throw new Error('Invalid profile response')
    return mapUser(res.user)
  },

  async patchOnboardingState(params: PatchOnboardingStateRequest): Promise<UserOnboardingState> {
    const res = await api.patch<PatchOnboardingStateResponse>('/api/v1/user/onboarding-state', params)
    return normalizeOnboardingState(res?.onboarding)
  },

  /** Call after login so server can run pending password-reset cleanup if any (user left before cleanup ran). */
  async ensurePostResetCleanup(): Promise<EnsurePostResetCleanupResponse> {
    return api.post<EnsurePostResetCleanupResponse>('/api/v1/user/ensure-post-reset-cleanup')
  },

  /**
   * Deletes encryption keys and owned vault data for the current user (irreversible).
   * Used when the user explicitly chooses to start fresh after losing access.
   */
  async startFreshCrypto(): Promise<{ ok: boolean }> {
    return api.post<{ ok: boolean }>('/api/v1/user/start-fresh-crypto')
  },
}
