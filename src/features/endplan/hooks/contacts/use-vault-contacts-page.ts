import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/client'
import {
  decryptSectionContent,
  encryptSectionContent,
  fetchBlobAsBase64,
  unwrapDekWithKeyPair,
} from '@/shared/lib'
import { useSubscription, resolveContactsMax } from '@/features/billing'
import { useKeyMaterial } from '@/features/keys'
import { useAuthUser } from '@/features/auth/session'
import { toast } from '@/shared/ui'
import {
  useDeleteVaultContacts,
  useUpsertVaultContacts,
} from '../../api/hooks/mutations/use-vault-mutations'
import { useUserVault, useVaultContacts } from '../../api/hooks/queries/use-vault-queries'
import {
  emptyContactsPayload,
  normalizeContactsPayload,
  type ContactFormInput,
  type ContactItem,
  type ContactRoleFilter,
  type ContactsSectionPayload,
  type ContactUpsertResult,
} from '../../model/contacts'
import { SECTION_ID } from '../../model/vault-section-types'
import { canAddContact, checkContactsAgainstPlan } from '../../model/plan-quota-guards'

export function useVaultContactsPage() {
  const { t } = useTranslation()
  const { user } = useAuthUser()
  const { data: vault, isLoading: isVaultLoading } = useUserVault({ ownerUserId: user?.id })
  const { data: subscriptionResponse } = useSubscription({ enabled: !!vault })
  const contactsMax = useMemo(
    () =>
      resolveContactsMax({
        features: subscriptionResponse?.features,
        tier: subscriptionResponse?.subscription?.tier,
        inTrial: subscriptionResponse?.inTrial,
        hasActiveSubscription: subscriptionResponse?.hasActiveSubscription,
        canAccess: subscriptionResponse?.canAccess,
      }),
    [
      subscriptionResponse?.canAccess,
      subscriptionResponse?.features,
      subscriptionResponse?.hasActiveSubscription,
      subscriptionResponse?.inTrial,
      subscriptionResponse?.subscription?.tier,
    ],
  )
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({ enabled: !!vault })
  const contactsQuery = useVaultContacts(vault?.id, { enabled: !!vault })
  const contactsSection = useMemo(() => contactsQuery.data ?? null, [contactsQuery.data])

  const [isDecrypting, setIsDecrypting] = useState(false)
  const [contactsPayload, setContactsPayload] = useState<ContactsSectionPayload>(
    emptyContactsPayload(),
  )
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<ContactRoleFilter>('all')

  const isOwner = !!vault && !!user && vault.ownerId === user.id

  const upsertContactsMutation = useUpsertVaultContacts(vault?.id ?? '')
  const deleteContactsMutation = useDeleteVaultContacts(vault?.id ?? '')

  const getDek = useCallback(async () => {
    if (!vault || !publicKeyB64 || !privateKeyB64) return null
    return unwrapDekWithKeyPair(vault.wrappedDek, publicKeyB64, privateKeyB64, pqPrivateKeyB64, {
      vaultId: vault.id,
    })
  }, [privateKeyB64, pqPrivateKeyB64, publicKeyB64, vault])

  useEffect(() => {
    let cancelled = false

    async function hydrateContacts() {
      if (!vault || !publicKeyB64 || !privateKeyB64) {
        if (!cancelled) setContactsPayload(emptyContactsPayload())
        return
      }
      setIsDecrypting(true)
      try {
        const dek = await getDek()
        if (!dek || cancelled) return

        if (contactsSection?.encryptionIv) {
          const encryptedData = contactsSection.blobUrl
            ? await fetchBlobAsBase64(contactsSection.blobUrl)
            : (contactsSection.encryptedData ?? '')
          const decoded = await decryptSectionContent(
            encryptedData,
            contactsSection.encryptionIv,
            dek,
            vault.id,
            vault.ownerId,
            SECTION_ID.CONTACTS,
          )
          if (!cancelled) setContactsPayload(normalizeContactsPayload(decoded))
        } else if (!cancelled) {
          setContactsPayload(emptyContactsPayload())
        }
      } catch {
        if (!cancelled) setContactsPayload(emptyContactsPayload())
      } finally {
        if (!cancelled) setIsDecrypting(false)
      }
    }

    void hydrateContacts()
    return () => {
      cancelled = true
    }
  }, [contactsSection, getDek, privateKeyB64, publicKeyB64, vault])

  const contacts = contactsPayload.items
  const canAddMoreContacts = useMemo(
    () => canAddContact({ contactsMax, currentCount: contacts.length }),
    [contactsMax, contacts.length],
  )

  const filteredContacts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return contacts.filter((contact) => {
      if (roleFilter !== 'all' && contact.role !== roleFilter) return false
      if (!normalizedQuery) return true
      return (
        contact.fullName.toLowerCase().includes(normalizedQuery) ||
        contact.email.toLowerCase().includes(normalizedQuery) ||
        contact.phone.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [contacts, roleFilter, searchQuery])

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId],
  )

  const persistPayload = useCallback(
    async (
      nextPayload: ContactsSectionPayload,
      activityChange: 'added' | 'updated',
    ) => {
      if (!vault) return false
      const dek = await getDek()
      if (!dek) {
        toast.error(t('vault.contacts.toast.encryptionKeysUnavailable'))
        return false
      }

      const { encryptedData, encryptionIv } = await encryptSectionContent(
        nextPayload,
        dek,
        vault.id,
        vault.ownerId,
        SECTION_ID.CONTACTS,
      )

      try {
        await upsertContactsMutation.mutateAsync({
          encryptedData,
          encryptionIv,
          expectedVersion: contactsSection?.version,
          itemCount: nextPayload.items.length,
          activityChange,
        })
        await contactsQuery.refetch()
        setContactsPayload(nextPayload)
        return true
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.apiMessage ?? t('vault.contacts.toast.saveFailed')
            : t('vault.contacts.toast.saveFailed')
        toast.error(message)
        return false
      }
    },
    [contactsQuery, contactsSection, getDek, t, upsertContactsMutation, vault],
  )

  const upsertContact = useCallback(
    async (input: ContactFormInput): Promise<ContactUpsertResult> => {
      const nowISO = new Date().toISOString()
      const existing = input.id
        ? contactsPayload.items.find((item) => item.id === input.id)
        : undefined
      const nextItem: ContactItem = {
        id: input.id ?? crypto.randomUUID(),
        fullName: input.fullName.trim(),
        role: input.role,
        customRoleLabel: input.role === 'other' ? input.customRoleLabel.trim() : '',
        phone: input.phone.trim(),
        email: input.email.trim(),
        notes: input.notes.trim(),
        createdAt: existing?.createdAt ?? nowISO,
        updatedAt: nowISO,
      }

      const nextPayload: ContactsSectionPayload = {
        schemaVersion: 1,
        items: existing
          ? contactsPayload.items.map((item) => (item.id === nextItem.id ? nextItem : item))
          : [nextItem, ...contactsPayload.items],
      }

      const contactsBlock = checkContactsAgainstPlan({
        limits: { contactsMax },
        itemCount: nextPayload.items.length,
      })
      if (contactsBlock) {
        toast.error(t('vault.contacts.toast.limitReached', { max: contactsBlock.max }))
        return { success: false }
      }

      const activityChange = existing ? 'updated' : 'added'
      const ok = await persistPayload(nextPayload, activityChange)
      if (ok) {
        toast.success(input.id ? t('vault.contacts.toast.updated') : t('vault.contacts.toast.created'))
        setSelectedContactId(nextItem.id)
      }
      return ok ? { success: true, savedContactId: nextItem.id } : { success: false }
    },
    [contactsMax, contactsPayload.items, persistPayload, t],
  )

  const deleteContact = useCallback(
    async (contactID: string) => {
      const remaining = contactsPayload.items.filter((item) => item.id !== contactID)
      if (remaining.length === 0 && contactsSection) {
        try {
          await deleteContactsMutation.mutateAsync()
          await contactsQuery.refetch()
          setContactsPayload(emptyContactsPayload())
          setSelectedContactId(null)
          toast.success(t('vault.contacts.toast.deleted'))
          return true
        } catch {
          toast.error(t('vault.contacts.toast.deleteFailed'))
          return false
        }
      }

      const ok = await persistPayload({ schemaVersion: 1, items: remaining }, 'updated')
      if (ok) {
        setSelectedContactId((current) => (current === contactID ? null : current))
        toast.success(t('vault.contacts.toast.deleted'))
      }
      return ok
    },
    [contactsPayload.items, contactsQuery, contactsSection, deleteContactsMutation, persistPayload, t],
  )

  return {
    vault,
    isOwner,
    isLoading: isVaultLoading || contactsQuery.isLoading || isDecrypting,
    isSaving: upsertContactsMutation.isPending || deleteContactsMutation.isPending,
    contacts,
    filteredContacts,
    contactsMax,
    canAddMoreContacts,
    selectedContactId,
    setSelectedContactId,
    selectedContact,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    upsertContact,
    deleteContact,
  }
}
