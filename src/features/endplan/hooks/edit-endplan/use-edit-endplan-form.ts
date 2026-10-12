import { useEffect, useRef, useState } from 'react'
import type { EndPlanData } from '../../api/services/endplan-service'
import type { VaultResponse } from '../../api/clients/vault-api'

type UseEditEndPlanFormParams = {
  vault: VaultResponse | null
  data: EndPlanData | null
}

export function useEditEndPlanForm(params: UseEditEndPlanFormParams) {
  const { vault, data } = params

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track which vault we've synced to avoid re-syncing on every render
  const lastSyncedVaultId = useRef<string | null>(null)

  useEffect(() => {
    if (!vault || !data) return
    // Only sync when vault identity changes (new vault loaded)
    if (lastSyncedVaultId.current === vault.id) return

    lastSyncedVaultId.current = vault.id
    // Intentional sync from external data to local form state.
    // This runs once per vault load, not on every render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(vault.name || '')
    setDescription(vault.description || '')
    setContent(data.content || '')
    setHasUnsavedChanges(false)
  }, [vault, data])

  const handleNameChange = (value: string) => {
    setName(value)
    setHasUnsavedChanges(true)
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    setHasUnsavedChanges(true)
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    setHasUnsavedChanges(true)
  }

  const markSaved = () => {
    setHasUnsavedChanges(false)
  }

  const confirmDiscard = () => {
    if (!hasUnsavedChanges) return true
    return window.confirm('You have unsaved changes. Are you sure you want to leave?')
  }

  return {
    name,
    description,
    content,
    hasUnsavedChanges,
    handleNameChange,
    handleDescriptionChange,
    handleContentChange,
    markSaved,
    confirmDiscard,
  }
}
