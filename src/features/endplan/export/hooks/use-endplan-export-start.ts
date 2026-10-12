import { useAuthUser } from '@/features/auth/session'
import { useKeyMaterial } from '@/features/keys'
import { useUserVault } from '../../api/hooks/queries/use-vault-queries'
import { startEndplanExport } from '../lib/start-endplan-export'
import { useEndplanExportStore } from '../model/export-job-store'

export function useEndplanExportStart() {
  const { user } = useAuthUser()
  const { data: vault, isLoading: isVaultLoading } = useUserVault({ ownerUserId: user?.id })
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64, hasRequiredKeys } = useKeyMaterial({
    enabled: !!vault,
  })
  const status = useEndplanExportStore((state) => state.status)
  const toastHidden = useEndplanExportStore((state) => state.toastHidden)
  const showToast = useEndplanExportStore((state) => state.showToast)

  const isRunning = status === 'running'
  const canStart = Boolean(vault && hasRequiredKeys && !isRunning)

  const startExport = () => {
    if (!vault || !publicKeyB64 || !privateKeyB64 || isRunning) return
    void startEndplanExport({
      vault,
      publicKeyB64,
      privateKeyB64,
      pqPrivateKeyB64,
      ownerName: user?.name?.trim() || user?.email || '',
    })
  }

  return {
    canStart,
    isRunning,
    isVaultLoading,
    hasVault: Boolean(vault),
    hasRequiredKeys,
    toastHidden,
    showProgress: showToast,
    startExport,
  }
}
