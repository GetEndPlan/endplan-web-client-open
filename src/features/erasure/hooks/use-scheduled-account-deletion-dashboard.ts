import { useCallback, useMemo, useState } from 'react'
import { useAuthUser, usePatchOnboardingState } from '@/features/auth'
import { useCancelErasureMutation, useErasureRequestsQuery } from '../api'

function daysUntilScheduledDeletion(scheduledExecuteAt: string): number {
  const end = new Date(scheduledExecuteAt).getTime()
  const diff = end - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function welcomeFirstName(displayName: string | undefined): string {
  const n = displayName?.trim()
  if (!n) return ''
  return n.split(/\s+/)[0] ?? n
}

export function useScheduledAccountDeletionDashboard() {
  const { user, isAuthenticated, onboarding } = useAuthUser()
  const patchOnboardingState = usePatchOnboardingState()
  const userId = user?.id ?? null
  const enabled = isAuthenticated && !!user
  const { data: requests, isFetched } = useErasureRequestsQuery({ enabled })
  const cancelMutation = useCancelErasureMutation()

  const scheduledRow = useMemo(
    () => requests?.find((r) => r.kind === 'full_account' && r.status === 'scheduled') ?? null,
    [requests],
  )

  const [showRestored, setShowRestored] = useState(false)

  const showWelcomeModal = Boolean(
    enabled &&
      isFetched &&
      scheduledRow &&
      !onboarding.scheduledAccountDeletionWelcomeDismissed &&
      !showRestored,
  )

  const daysRemaining = scheduledRow ? daysUntilScheduledDeletion(scheduledRow.scheduledExecuteAt) : 0
  const firstName = welcomeFirstName(user?.name) || user?.email?.split('@')[0] || ''

  const dismissWelcome = useCallback(() => {
    if (!userId) return
    patchOnboardingState.mutate({ scheduledAccountDeletionWelcomeDismissed: true })
  }, [patchOnboardingState, userId])

  const restoreAccount = useCallback(async () => {
    if (!scheduledRow || !userId) return
    await cancelMutation.mutateAsync(scheduledRow.id)
    patchOnboardingState.mutate({ scheduledAccountDeletionWelcomeDismissed: true })
    setShowRestored(true)
  }, [cancelMutation, patchOnboardingState, scheduledRow, userId])

  const closeRestoredModal = useCallback(() => {
    setShowRestored(false)
  }, [])

  return {
    showWelcomeModal,
    showRestoredModal: showRestored,
    scheduledRow,
    daysRemaining,
    welcomeFirstName: firstName,
    dismissWelcome,
    restoreAccount,
    closeRestoredModal,
    isRestoring: cancelMutation.isPending,
  }
}
