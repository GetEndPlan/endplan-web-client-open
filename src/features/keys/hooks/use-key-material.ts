import { useKeys } from '../api/hooks/keys-hooks'
import {
  useKeysStore,
  selectPrivateKey,
  selectPublicKey,
  selectPqPrivateKey,
  selectPqPublicKey,
} from '../model/keys-store'

type UseKeyMaterialOptions = {
  enabled?: boolean
}

export function useKeyMaterial(options?: UseKeyMaterialOptions) {
  const { data: keysFromQuery, isLoading: isServerKeysLoading } = useKeys({
    enabled: options?.enabled ?? true,
  })
  const storePublicKeyB64 = useKeysStore(selectPublicKey)
  const privateKeyB64 = useKeysStore(selectPrivateKey)
  const storePqPublicKeyB64 = useKeysStore(selectPqPublicKey)
  const pqPrivateKeyB64 = useKeysStore(selectPqPrivateKey)

  const publicKeyB64 = keysFromQuery?.publicKeyB64 ?? storePublicKeyB64 ?? null
  const pqPublicKeyB64 = keysFromQuery?.pqPublicKeyB64 ?? storePqPublicKeyB64 ?? null
  const hasServerKeys = !!(keysFromQuery || storePublicKeyB64)
  const hasRequiredKeys = !!(publicKeyB64 && privateKeyB64)
  const hasHybridReadyKeys = !!(publicKeyB64 && privateKeyB64 && pqPublicKeyB64 && pqPrivateKeyB64)

  return {
    publicKeyB64,
    privateKeyB64,
    pqPublicKeyB64,
    pqPrivateKeyB64,
    keyBundleVersion: keysFromQuery?.keyBundleVersion ?? null,
    hasServerKeys,
    hasRequiredKeys,
    hasHybridReadyKeys,
    isServerKeysLoading,
  }
}
