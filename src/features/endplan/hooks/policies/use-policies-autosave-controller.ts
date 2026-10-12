import { useCallback, useEffect, useRef, useState } from 'react'

export type VaultPoliciesAutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'
export type VaultPoliciesPersistResult = 'saved' | 'offline' | 'error' | 'noop' | 'blocked'

type UseAssetsAutosaveControllerInput = {
  enabled: boolean
  isOffline: boolean
  persist: () => Promise<VaultPoliciesPersistResult>
}

type UseAssetsAutosaveControllerOutput = {
  autosaveStatus: VaultPoliciesAutosaveStatus
  lastSavedAt: number | null
  markDirty: () => void
  setEditorActive: (active: boolean) => void
  reset: () => void
  markSaved: () => void
}

export function usePoliciesAutosaveController(
  input: UseAssetsAutosaveControllerInput,
): UseAssetsAutosaveControllerOutput {
  const { enabled, isOffline, persist } = input
  const [autosaveStatus, setAutosaveStatus] = useState<VaultPoliciesAutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autosaveInFlightRef = useRef(false)
  const autosaveQueuedRef = useRef(false)
  const hasUnsavedChangesRef = useRef(false)
  const isEditorActiveRef = useRef(false)
  const wasOfflineRef = useRef(isOffline)

  const scheduleFlush = useCallback(
    (delayMs: number, flush: () => Promise<void>) => {
      if (!enabled || isOffline || isEditorActiveRef.current) return
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
      autosaveTimerRef.current = setTimeout(() => {
        void flush()
      }, delayMs)
    },
    [enabled, isOffline],
  )

  const flushRef = useRef<(options?: { ignoreEditorActive?: boolean }) => Promise<void>>(async () => {})

  const flushAutosave = useCallback(async (options?: { ignoreEditorActive?: boolean }) => {
    if (!enabled || !hasUnsavedChangesRef.current) return
    if (isOffline) {
      autosaveQueuedRef.current = true
      setAutosaveStatus('pending')
      return
    }
    if (!options?.ignoreEditorActive && isEditorActiveRef.current) {
      autosaveQueuedRef.current = true
      return
    }
    if (autosaveInFlightRef.current) {
      autosaveQueuedRef.current = true
      return
    }

    autosaveInFlightRef.current = true
    hasUnsavedChangesRef.current = false
    setAutosaveStatus('saving')

    const result = await persist()
    autosaveInFlightRef.current = false

    if (result === 'saved' || result === 'noop') {
      autosaveQueuedRef.current = false
      setAutosaveStatus('saved')
      setLastSavedAt(Date.now())
    } else if (result === 'blocked') {
      autosaveQueuedRef.current = false
      hasUnsavedChangesRef.current = false
      setAutosaveStatus('error')
    } else {
      hasUnsavedChangesRef.current = true
      setAutosaveStatus(result === 'offline' ? 'pending' : 'error')
    }

    // Do not auto-retry on a timer — next blur, reconnect, or tab-hide will flush.
    autosaveQueuedRef.current = false
  }, [enabled, isOffline, persist])

  useEffect(() => {
    flushRef.current = flushAutosave
  }, [flushAutosave])

  // Marks local unsaved state only. Server persist runs on blur, reconnect, or tab hide.
  const markDirty = useCallback(() => {
    hasUnsavedChangesRef.current = true
    if (!autosaveInFlightRef.current) {
      setAutosaveStatus('pending')
    }
  }, [])

  const setEditorActive = useCallback(
    (active: boolean) => {
      isEditorActiveRef.current = active
      if (active) {
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current)
          autosaveTimerRef.current = null
        }
        return
      }
      if (!enabled || isOffline) return
      if (!hasUnsavedChangesRef.current && !autosaveQueuedRef.current) return
      scheduleFlush(700, () => flushRef.current())
    },
    [enabled, isOffline, scheduleFlush],
  )

  const reset = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }
    autosaveInFlightRef.current = false
    autosaveQueuedRef.current = false
    hasUnsavedChangesRef.current = false
    isEditorActiveRef.current = false
    setAutosaveStatus('idle')
    setLastSavedAt(null)
  }, [])

  const markSaved = useCallback(() => {
    hasUnsavedChangesRef.current = false
    autosaveQueuedRef.current = false
    setAutosaveStatus('saved')
    setLastSavedAt(Date.now())
  }, [])

  useEffect(() => {
    const justWentOffline = isOffline && !wasOfflineRef.current
    const justCameOnline = !isOffline && wasOfflineRef.current
    wasOfflineRef.current = isOffline

    if (isOffline) {
      // Cancel any pending timer when offline
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
      // Only update status on transition to offline (not every render).
      // Guarded by justWentOffline to prevent cascading renders.
      if (justWentOffline && (hasUnsavedChangesRef.current || autosaveQueuedRef.current)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAutosaveStatus('pending')
      }
      return
    }

    // Just came back online — try to flush if there are pending changes
    if (justCameOnline && (hasUnsavedChangesRef.current || autosaveQueuedRef.current)) {
      scheduleFlush(450, () => flushRef.current())
    }
  }, [isOffline, scheduleFlush])

  useEffect(() => {
    if (!enabled) return

    const flushOnTabHide = () => {
      if (document.visibilityState !== 'hidden') return
      if (!hasUnsavedChangesRef.current && !autosaveQueuedRef.current) return
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
      void flushRef.current({ ignoreEditorActive: true })
    }

    document.addEventListener('visibilitychange', flushOnTabHide)
    return () => document.removeEventListener('visibilitychange', flushOnTabHide)
  }, [enabled])

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [])

  return {
    autosaveStatus,
    lastSavedAt,
    markDirty,
    setEditorActive,
    reset,
    markSaved,
  }
}
