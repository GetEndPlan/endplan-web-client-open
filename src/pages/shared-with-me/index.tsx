import { useNavigate } from 'react-router-dom'
import { sharedEndplanPath } from '@/app/constants/routes'
import {
  useSharedWithMePage,
  SharedWithMeHeader,
  SharedWithMeLockedState,
  SharedWithMeListCard,
  SharedWithMeEmptyState,
} from '@/features/endplan'

export function SharedWithMePage() {
  const navigate = useNavigate()
  const { sharedVaults, isLoadingShared, keysAvailable, hasOwnKeyPerson } = useSharedWithMePage()

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  const handleOpenVault = (vaultId: string) => {
    navigate(sharedEndplanPath(vaultId))
  }

  if (!keysAvailable) {
    return (
      <div className="space-y-6">
        <SharedWithMeHeader showSubtitle={false} />
        <SharedWithMeLockedState onNavigate={handleNavigate} />
      </div>
    )
  }

  const showEmptyState = !isLoadingShared && sharedVaults.length === 0

  return (
    <div className="space-y-6">
      <SharedWithMeHeader showSubtitle />
      {showEmptyState ? (
        <SharedWithMeEmptyState showKeyPersonPrompt={!hasOwnKeyPerson} />
      ) : (
        <SharedWithMeListCard
          sharedVaults={sharedVaults}
          isLoadingShared={isLoadingShared}
          onOpenVault={handleOpenVault}
        />
      )}
    </div>
  )
}
