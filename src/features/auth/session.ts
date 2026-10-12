import { useCallback } from 'react'
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@/entities/user'
import { keysKeys, useKeysStore } from '@/features/keys'
import {
  clearAllPendingAssetsAutosaveSnapshots,
  ensureOwnedVaultIfMissing,
  migrateOwnedVaultWrappedDeksIfNeeded,
  persistRecoveryPhraseToVault,
  rewrapOwnDeksAfterKeyUpgrade,
  vaultKeys,
} from '@/features/endplan'
import { toast } from '@/shared/ui'
import { ApiError } from '@/shared/api/client'
import { AuthClientError, isAuthClientError } from './model/auth-client-error'
import { authApi, type AuthResult, type LoginParams, type SignupParams } from './api/auth-api'
import { useProfile, userKeys } from './api/hooks/user-hooks'
import type { ProfileBundle, UserOnboardingState } from './api/profile-api'

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}

export const FIRST_SIGNUP_SESSION_KEY = 'endplan:first-signup-user-id'
export const DASHBOARD_WELCOME_DISMISSED_SESSION_KEY =
  'endplan:dashboard-welcome-dismissed-user-id'
/** Set when the user clicks Continue (any step); prevents reopening the welcome flow on later visits this session */
export const DASHBOARD_WELCOME_CONTINUE_ACK_SESSION_KEY =
  'endplan:dashboard-welcome-continue-ack-user-id'
/** Set when the user dismisses or completes the scheduled full-account deletion welcome; cleared on logout */
export const SCHEDULED_ACCOUNT_DELETION_WELCOME_SUPPRESSED_SESSION_KEY =
  'endplan:sched-acct-deletion-welcome-suppressed-user-id'

function setSessionUserCache(client: QueryClient, user: User | null) {
  client.setQueryData<AuthResult>(authKeys.session(), { user, error: null, errorCode: null })
}

function resolveSafeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const apiMessage = error.apiMessage?.trim()
    if (apiMessage) {
      return apiMessage
    }
    return fallback
  }

  if (error instanceof Error) {
    const message = error.message.trim()
    if (message) {
      return message
    }
  }

  return fallback
}

export function useAuthSession(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => authApi.getSession(),
    enabled: options?.enabled ?? true,
    retry: false,
  })
}

export function useAuthUser(options?: { enabled?: boolean }) {
  const sessionQuery = useAuthSession(options)
  const sessionUser = sessionQuery.data?.user ?? null

  const profileQuery = useProfile({
    enabled: (options?.enabled ?? true) && !!sessionUser,
  })

  const user = profileQuery.data?.user ?? sessionUser
  const onboarding: UserOnboardingState = profileQuery.data?.onboarding ?? {
    dashboardWelcomeDismissed: false,
    dashboardWelcomeIntroAcknowledged: false,
    dashboardNavTourSettled: false,
    recoveryPhraseOnboardingCompleted: false,
    recoveryPhraseOnboardingDeferredUntil: null,
    scheduledAccountDeletionWelcomeDismissed: false,
    trialPlanBadgeDismissedKey: null,
  }
  const isAuthenticated = !!sessionUser
  const isInitialized =
    sessionQuery.isFetched &&
    (!sessionUser || profileQuery.isFetched || profileQuery.isError)

  const rawError = sessionQuery.error ?? profileQuery.error ?? null
  const error = rawError instanceof Error ? rawError : null

  return {
    user,
    isAuthenticated,
    isInitialized,
    isLoading: !isInitialized,
    error,
    onboarding,
    refetchSession: sessionQuery.refetch,
    refetchProfile: profileQuery.refetch,
  }
}

export function useLogin() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (params: LoginParams): Promise<User> => {
      const result = await authApi.login(params)
      if (result.error || !result.user) {
        throw new Error(result.error ?? 'Login failed')
      }

      try {
        // Force a post-login session round-trip before key bootstrap so the
        // subsequent /keys request doesn't race session establishment.
        await authApi.getSession()
        const bootstrap = await useKeysStore.getState().ensureKeys(params.password)

        const { publicKeyB64, privateKeyB64, pqPublicKeyB64, pqPrivateKeyB64 } = useKeysStore.getState()

        if (
          publicKeyB64 &&
          privateKeyB64 &&
          result.user.id &&
          bootstrap.recoveryMnemonicForVault
        ) {
          try {
            await persistRecoveryPhraseToVault({
              ownerId: result.user.id,
              publicKeyB64,
              privateKeyB64,
              pqPublicKeyB64,
              pqPrivateKeyB64,
              mnemonic: bootstrap.recoveryMnemonicForVault,
            })
            client.invalidateQueries({ queryKey: vaultKeys.all })
          } catch {
            // Non-fatal; user can add backup from Settings if this fails.
          }
        }

        if (publicKeyB64 && privateKeyB64) {
          void migrateOwnedVaultWrappedDeksIfNeeded({
            actorUserId: result.user.id,
            actorPublicKeyB64: publicKeyB64,
            actorPrivateKeyB64: privateKeyB64,
            actorPqPublicKeyB64: pqPublicKeyB64,
            actorPqPrivateKeyB64: pqPrivateKeyB64,
          }).catch(() => undefined)

          void rewrapOwnDeksAfterKeyUpgrade({
            actorPublicKeyB64: publicKeyB64,
            actorPrivateKeyB64: privateKeyB64,
            actorPqPublicKeyB64: pqPublicKeyB64,
            actorPqPrivateKeyB64: pqPrivateKeyB64,
          }).catch(() => undefined)
        }
      } catch (keyError) {
        toast.error(
          resolveSafeErrorMessage(
            keyError,
            'Signed in, but your encryption keys could not be unlocked.',
          ),
          { durationMs: 10000 },
        )
      }

      return result.user
    },
    onSuccess: (user) => {
      setSessionUserCache(client, user)
      client.invalidateQueries({ queryKey: userKeys.profile() })
      client.invalidateQueries({ queryKey: keysKeys.all })
    },
  })
}

export function useSignup() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (params: SignupParams): Promise<User> => {
      let result: Awaited<ReturnType<typeof authApi.signup>>
      try {
        result = await authApi.signup(params)
      } catch (error) {
        if (isAuthClientError(error)) {
          throw error
        }
        throw new AuthClientError(error instanceof Error ? error.message : 'Signup failed', null)
      }
      if (result.error || !result.user) {
        throw new AuthClientError(result.error ?? 'Signup failed', result.errorCode)
      }

      try {
        // Match login: post-signup session round-trip before key bootstrap so
        // /keys and vault requests do not race session cookie establishment.
        await authApi.getSession()
        const bootstrap = await useKeysStore.getState().generateKeys(params.password)
        client.invalidateQueries({ queryKey: keysKeys.all })

        const { publicKeyB64, privateKeyB64, pqPublicKeyB64, pqPrivateKeyB64 } = useKeysStore.getState()
        if (publicKeyB64) {
          await ensureOwnedVaultIfMissing({
            ownerId: result.user.id,
            publicKeyB64,
            pqPublicKeyB64,
          })
          if (privateKeyB64 && bootstrap.recoveryMnemonicForVault) {
            try {
              await persistRecoveryPhraseToVault({
                ownerId: result.user.id,
                publicKeyB64,
                privateKeyB64,
                pqPublicKeyB64,
                pqPrivateKeyB64,
                mnemonic: bootstrap.recoveryMnemonicForVault,
              })
            } catch {
              // Non-fatal; Settings recovery flow can repair.
            }
          }
          client.invalidateQueries({ queryKey: vaultKeys.all })
        }
      } catch (keyError) {
        toast.error(
          resolveSafeErrorMessage(
            keyError,
            'Account created, but secure setup could not be completed.',
          ),
          { durationMs: 10000 },
        )
      }

      return result.user
    },
    onSuccess: (user) => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(FIRST_SIGNUP_SESSION_KEY, user.id)
      }
      setSessionUserCache(client, user)
      client.invalidateQueries({ queryKey: userKeys.profile() })
      client.invalidateQueries({ queryKey: keysKeys.all })
    },
  })
}

export function useLogout() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await authApi.logout()
    },
    onSuccess: async () => {
      await client.cancelQueries()
      useKeysStore.getState().clearKeys()
      await clearAllPendingAssetsAutosaveSnapshots()
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(SCHEDULED_ACCOUNT_DELETION_WELCOME_SUPPRESSED_SESSION_KEY)
      }
      setSessionUserCache(client, null)
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== authKeys.all[0],
      })
    },
  })
}

export function useMarkEmailVerified() {
  const client = useQueryClient()

  return useCallback(() => {
    const currentSession = client.getQueryData<AuthResult>(authKeys.session())
    if (currentSession?.user) {
      setSessionUserCache(client, {
        ...currentSession.user,
        emailVerified: true,
      })
    }

    // Profile cache is `{ user, onboarding }`; `useAuthUser` prefers `profile.user` over session.
    client.setQueryData<ProfileBundle>(userKeys.profile(), (current) => {
      if (!current?.user) return current
      return {
        ...current,
        user: { ...current.user, emailVerified: true },
      }
    })
  }, [client])
}
