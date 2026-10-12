import { useEffect, useState } from 'react'
import { useKeyMaterial, useKeysStore } from '@/features/keys'

type UseUnlockGateOptions = {
  enabled: boolean
}

export function useUnlockGate({ enabled }: UseUnlockGateOptions) {
  const { privateKeyB64, hasServerKeys, isServerKeysLoading } = useKeyMaterial({ enabled })
  const [keysHydrated, setKeysHydrated] = useState(() => useKeysStore.persist.hasHydrated())

  useEffect(() => {
    const unsubscribe = useKeysStore.persist.onFinishHydration(() => setKeysHydrated(true))
    return unsubscribe
  }, [])

  const needsUnlock = keysHydrated && enabled && hasServerKeys && !privateKeyB64
  const needsKeySetup =
    keysHydrated && enabled && !isServerKeysLoading && !hasServerKeys && !privateKeyB64
  const needsCryptoGate = needsUnlock || needsKeySetup

  return {
    /** True when user must unlock existing keys or set up new keys after Start fresh. */
    needsUnlock: needsCryptoGate,
    needsUnlockOnly: needsUnlock,
    needsKeySetup,
  }
}

