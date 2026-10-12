import { useState, type FormEvent } from 'react'
import { ApiError } from '@/shared/api'
import { useCreateOrUpdateEndPlan } from '../../api/services/endplan-mutations'
import type { VaultResponse } from '../../api/clients/vault-api'

type UseCreateEndPlanFormParams = {
  vault: VaultResponse | null
  isVaultResolved: boolean
  publicKeyB64: string | null
  pqPublicKeyB64?: string | null
  privateKeyB64: string | null
  pqPrivateKeyB64?: string | null
  ownerId: string | undefined
  onSuccess: () => void
}

export function useCreateEndPlanForm(params: UseCreateEndPlanFormParams) {
  const {
    vault,
    isVaultResolved,
    publicKeyB64,
    pqPublicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
    ownerId,
    onSuccess,
  } = params
  const createOrUpdateEndPlan = useCreateOrUpdateEndPlan()

  // Track user edits separately; null means "use vault name"
  const [userEditedName, setUserEditedName] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  // Derive: user edit takes precedence, otherwise use vault name, then empty string
  const name = userEditedName ?? vault?.name ?? ''

  const setName = (value: string) => {
    setUserEditedName(value)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLimitReached(false)

    if (!content.trim()) {
      setError('Please enter some content for your EndPlan')
      return
    }

    if (!isVaultResolved) {
      setError('Still loading EndPlan status. Please try again in a moment.')
      return
    }

    if (!publicKeyB64) {
      setError('Encryption keys not available. Please log out and log in again.')
      return
    }

    if (!ownerId) {
      setError('User information not available. Please log out and log in again.')
      return
    }

    try {
      await createOrUpdateEndPlan.mutateAsync({
        existingVault: vault,
        name: name.trim() || 'My EndPlan',
        description: description.trim() || undefined,
        content: content.trim(),
        publicKeyB64,
        pqPublicKeyB64,
        privateKeyB64: privateKeyB64 || undefined,
        pqPrivateKeyB64,
        ownerId,
      })
      onSuccess()
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.isLimitReached) {
        setError(
          submitError.apiMessage || 'EndPlan limit reached for your plan. Upgrade to create more EndPlans.',
        )
        setLimitReached(true)
        return
      }
      setError(submitError instanceof Error ? submitError.message : 'Failed to create EndPlan')
    }
  }

  return {
    name,
    setName,
    description,
    setDescription,
    content,
    setContent,
    error,
    limitReached,
    isSubmitting: createOrUpdateEndPlan.isPending,
    handleSubmit,
  }
}
