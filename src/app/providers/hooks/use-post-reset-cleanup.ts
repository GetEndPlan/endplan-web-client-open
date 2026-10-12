import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/features/auth'
import { clearAllPendingAssetsAutosaveSnapshots } from '@/features/endplan'
import { useKeysStore } from '@/features/keys'
import { toast } from '@/shared/ui'
import { shouldSuppressPostResetCleanupError } from './post-reset-cleanup-errors'

const postResetCleanupCompletedUserIds = new Set<string>()
const POST_RESET_RETRY_DELAY_MS = 5_000
const MAX_POST_RESET_CLEANUP_ATTEMPTS = 3

type UsePostResetCleanupOptions = {
  userId: string | undefined
}

/**
 * Runs server-side post-password-reset cleanup once per authenticated user id.
 * Side effects are centralized in provider layer so layout components stay presentational.
 */
export function usePostResetCleanup({ userId }: UsePostResetCleanupOptions) {
  const queryClient = useQueryClient()
  const [retryToken, setRetryToken] = useState(0)
  const retryCountRef = useRef(0)

  useEffect(() => {
    retryCountRef.current = 0
  }, [userId])

  useEffect(() => {
    if (!userId) return
    if (postResetCleanupCompletedUserIds.has(userId)) return

    let cancelled = false
    let retryTimer: number | undefined

    profileApi
      .ensurePostResetCleanup()
      .then((res) => {
        if (cancelled) return

        postResetCleanupCompletedUserIds.add(userId)
        retryCountRef.current = 0

        if (res?.cleanupRun) {
          queryClient.clear()
          useKeysStore.getState().clearKeys()
          void clearAllPendingAssetsAutosaveSnapshots()
        }
      })
      .catch((error) => {
        if (cancelled) return
        if (shouldSuppressPostResetCleanupError(error)) return

        if (retryCountRef.current >= MAX_POST_RESET_CLEANUP_ATTEMPTS - 1) {
          toast.error('We could not finish secure account cleanup after your password reset. Please refresh and try again.')
          return
        }

        retryCountRef.current += 1
        retryTimer = window.setTimeout(() => {
          setRetryToken((current) => current + 1)
        }, POST_RESET_RETRY_DELAY_MS)
      })

    return () => {
      cancelled = true
      if (retryTimer) {
        window.clearTimeout(retryTimer)
      }
    }
  }, [queryClient, retryToken, userId])
}
