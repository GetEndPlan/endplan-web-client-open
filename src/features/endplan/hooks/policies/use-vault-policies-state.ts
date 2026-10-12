import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import type { AssetSectionPayloadV2 } from '../../model/asset-table-model'
import {
  loadPendingPoliciesAutosaveSnapshot,
  type PendingPoliciesAutosaveSnapshot,
} from '../../model/policies-autosave-queue'
import { emptyAssetsPayload } from './vault-policies-shared'

export type VaultPoliciesStateRefs = {
  hydratedKeyRef: MutableRefObject<string | null>
  hydratingKeyRef: MutableRefObject<string | null>
  skipNextHydrationKeyRef: MutableRefObject<string | null>
  lastPersistedPayloadHashRef: MutableRefObject<string | null>
  lastPersistedPayloadRef: MutableRefObject<AssetSectionPayloadV2 | null>
  pendingSnapshotExistsRef: MutableRefObject<boolean>
  pendingSnapshotWriteTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
  restoredPendingSnapshotKeyRef: MutableRefObject<string | null>
  replayMarkedSnapshotKeyRef: MutableRefObject<string | null>
  latestSectionVersionRef: MutableRefObject<number | null>
  hasLocalUnsavedChangesRef: MutableRefObject<boolean>
  saveInFlightRef: MutableRefObject<boolean>
}

type UseVaultPoliciesStateInput = {
  vaultId: string | null
}

type UseVaultPoliciesStateOutput = {
  selectedCategoryIds: string[]
  setSelectedCategoryIds: Dispatch<SetStateAction<string[]>>
  payload: AssetSectionPayloadV2
  setPayload: Dispatch<SetStateAction<AssetSectionPayloadV2>>
  isDecrypting: boolean
  setIsDecrypting: Dispatch<SetStateAction<boolean>>
  hasInitiallyLoaded: boolean
  setHasInitiallyLoaded: Dispatch<SetStateAction<boolean>>
  saveApiCallCount: number
  setSaveApiCallCount: Dispatch<SetStateAction<number>>
  pendingSnapshot: PendingPoliciesAutosaveSnapshot | null
  setPendingSnapshot: Dispatch<SetStateAction<PendingPoliciesAutosaveSnapshot | null>>
  isPendingSnapshotLoaded: boolean
  isOffline: boolean
  setIsOffline: Dispatch<SetStateAction<boolean>>
  refs: VaultPoliciesStateRefs
}

export function useVaultPoliciesState(input: UseVaultPoliciesStateInput): UseVaultPoliciesStateOutput {
  const { vaultId } = input

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [payload, setPayload] = useState<AssetSectionPayloadV2>(emptyAssetsPayload())
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const [saveApiCallCount, setSaveApiCallCount] = useState(0)
  const [pendingSnapshot, setPendingSnapshot] = useState<PendingPoliciesAutosaveSnapshot | null>(null)
  const [isPendingSnapshotLoaded, setIsPendingSnapshotLoaded] = useState(false)
  const [isOffline, setIsOffline] = useState(() =>
    typeof window !== 'undefined' ? !window.navigator.onLine : false,
  )
  const hydratedKeyRef = useRef<string | null>(null)
  const hydratingKeyRef = useRef<string | null>(null)
  const skipNextHydrationKeyRef = useRef<string | null>(null)
  const lastPersistedPayloadHashRef = useRef<string | null>(null)
  const lastPersistedPayloadRef = useRef<AssetSectionPayloadV2 | null>(null)
  const pendingSnapshotExistsRef = useRef(false)
  const pendingSnapshotWriteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoredPendingSnapshotKeyRef = useRef<string | null>(null)
  const replayMarkedSnapshotKeyRef = useRef<string | null>(null)
  const latestSectionVersionRef = useRef<number | null>(null)
  const hasLocalUnsavedChangesRef = useRef(false)
  const saveInFlightRef = useRef(false)

  useEffect(() => {
    hydratedKeyRef.current = null
    hydratingKeyRef.current = null
    skipNextHydrationKeyRef.current = null
    lastPersistedPayloadHashRef.current = null
    lastPersistedPayloadRef.current = null
    pendingSnapshotExistsRef.current = false
    restoredPendingSnapshotKeyRef.current = null
    replayMarkedSnapshotKeyRef.current = null
    latestSectionVersionRef.current = null
    hasLocalUnsavedChangesRef.current = false
    saveInFlightRef.current = false
    if (pendingSnapshotWriteTimerRef.current) {
      clearTimeout(pendingSnapshotWriteTimerRef.current)
      pendingSnapshotWriteTimerRef.current = null
    }
    // Intentional full state reset on vault identity change, not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCategoryIds([])
    setPayload(emptyAssetsPayload())
    setIsDecrypting(false)
    setHasInitiallyLoaded(false)
    setPendingSnapshot(null)
    setIsPendingSnapshotLoaded(false)
    setSaveApiCallCount(0)
  }, [vaultId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadPendingSnapshot = async () => {
      if (!vaultId) {
        pendingSnapshotExistsRef.current = false
        setPendingSnapshot(null)
        setIsPendingSnapshotLoaded(true)
        return
      }

      setIsPendingSnapshotLoaded(false)
      let snapshot: PendingPoliciesAutosaveSnapshot | null = null
      try {
        snapshot = await loadPendingPoliciesAutosaveSnapshot(vaultId)
      } catch {
        snapshot = null
      }
      if (cancelled) return
      pendingSnapshotExistsRef.current = snapshot != null
      setPendingSnapshot(snapshot)
      setIsPendingSnapshotLoaded(true)
    }

    void loadPendingSnapshot()

    return () => {
      cancelled = true
    }
  }, [vaultId])

  useEffect(() => {
    return () => {
      if (pendingSnapshotWriteTimerRef.current) {
        clearTimeout(pendingSnapshotWriteTimerRef.current)
      }
    }
  }, [])

  return {
    selectedCategoryIds,
    setSelectedCategoryIds,
    payload,
    setPayload,
    isDecrypting,
    setIsDecrypting,
    hasInitiallyLoaded,
    setHasInitiallyLoaded,
    saveApiCallCount,
    setSaveApiCallCount,
    pendingSnapshot,
    setPendingSnapshot,
    isPendingSnapshotLoaded,
    isOffline,
    setIsOffline,
    refs: {
      hydratedKeyRef,
      hydratingKeyRef,
      skipNextHydrationKeyRef,
      lastPersistedPayloadHashRef,
      lastPersistedPayloadRef,
      pendingSnapshotExistsRef,
      pendingSnapshotWriteTimerRef,
      restoredPendingSnapshotKeyRef,
      replayMarkedSnapshotKeyRef,
      latestSectionVersionRef,
      hasLocalUnsavedChangesRef,
      saveInFlightRef,
    },
  }
}
