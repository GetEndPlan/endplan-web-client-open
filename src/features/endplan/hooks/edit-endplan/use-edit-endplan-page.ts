import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/constants/routes'
import { toast } from '@/shared/ui'
import { useAuthUser } from '@/features/auth/session'
import { useSaveEndPlan } from '@/features/endplan/api/services/endplan-mutations'
import { useDecryptedUserVault } from '@/features/endplan/api/hooks/queries/use-vault-queries'
import { useKeyMaterial } from '@/features/keys'
import { useEditEndPlanForm } from './use-edit-endplan-form'
import { useEditEndPlanRelease } from './use-edit-endplan-release'

export function useEditEndPlanPage() {
  const navigate = useNavigate()
  const { user } = useAuthUser()

  const {
    vault,
    data,
    isLoading: isVaultDataLoading,
    isResolved: isVaultResolved,
    error: vaultDataError,
  } = useDecryptedUserVault({ ownerUserId: user?.id })

  const save = useSaveEndPlan()
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64, hasRequiredKeys } = useKeyMaterial()

  const {
    name,
    description,
    content,
    hasUnsavedChanges,
    handleNameChange,
    handleDescriptionChange,
    handleContentChange,
    markSaved,
    confirmDiscard,
  } = useEditEndPlanForm({
    vault,
    data,
  })

  const {
    pendingReleaseInvitations,
    isReleasing,
    refetchPending,
    handleReleaseAll,
  } = useEditEndPlanRelease()

  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isVaultResolved) {
      setError('EndPlan is still loading. Please try again in a moment.')
      return
    }

    if (!vault) {
      setError('No EndPlan available to save.')
      return
    }

    if (!publicKeyB64 || !privateKeyB64) {
      setError('Encryption keys not available. Please log out and log in again.')
      return
    }

    try {
      await save.mutateAsync({
        vault,
        name: name.trim() || 'My EndPlan',
        description: description.trim() || undefined,
        content: content.trim(),
        publicKeyB64,
        privateKeyB64,
        pqPrivateKeyB64,
      })
      markSaved()
      toast.success('EndPlan saved successfully!')
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save EndPlan')
    }
  }

  const handleBack = () => {
    if (!confirmDiscard()) return
    navigate(ROUTES.DASHBOARD)
  }

  const displayError = error || (vaultDataError instanceof Error ? vaultDataError.message : null)

  return {
    vault,
    data,
    name,
    description,
    content,
    hasUnsavedChanges,
    displayError,
    isSaving: save.isPending,
    isVaultDataLoading,
    hasRequiredKeys,
    pendingReleaseInvitations,
    isReleasing,
    refetchPending,
    handleNameChange,
    handleDescriptionChange,
    handleContentChange,
    handleSave,
    handleBack,
    handleReleaseAll,
  }
}
