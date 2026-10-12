import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { decryptSectionContent, fetchBlobAsBase64, unwrapDekWithKeyPair } from '@/shared/lib'
import { useKeyMaterial } from '@/features/keys'
import { useVaultContacts } from '../../api/hooks/queries/use-vault-queries'
import {
  contactRoleDisplayLabel,
  normalizeContactsPayload,
  type ContactRole,
} from '../../model/contacts'
import type { AssetContactOption } from '../../model/asset-contact-ref'
import { SECTION_ID } from '../../model/vault-section-types'
import type { VaultResponse } from '../../api/clients/vault-api'

export function useVaultAssetsContactOptions(vault: VaultResponse | null | undefined) {
  const { t } = useTranslation()
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({ enabled: !!vault })
  const contactsQuery = useVaultContacts(vault?.id, { enabled: !!vault })
  const contactsSection = contactsQuery.data ?? null
  const [contactOptions, setContactOptions] = useState<AssetContactOption[]>([])

  const contactRoleLabels = useMemo(() => {
    const labels = {} as Record<ContactRole, string>
    for (const role of [
      'lawyer',
      'doctor',
      'financial_manager',
      'power_of_attorney',
      'other',
    ] as const) {
      labels[role] = t(`vault.contacts.roles.${role}`)
    }
    return labels
  }, [t])

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
        if (!cancelled) setContactOptions([])
        return
      }
      if (!contactsSection?.encryptionIv) {
        if (!cancelled) setContactOptions([])
        return
      }

      try {
        const dek = await getDek()
        if (!dek || cancelled) return

        const encryptedContacts = contactsSection.blobUrl
          ? await fetchBlobAsBase64(contactsSection.blobUrl)
          : (contactsSection.encryptedData ?? '')
        const decodedContacts = await decryptSectionContent(
          encryptedContacts,
          contactsSection.encryptionIv,
          dek,
          vault.id,
          vault.ownerId,
          SECTION_ID.CONTACTS,
        )
        const nextOptions: AssetContactOption[] = normalizeContactsPayload(decodedContacts).items.map(
          (contact) => ({
            id: contact.id,
            label: contact.fullName,
            subtitle: contactRoleDisplayLabel(contact, contactRoleLabels),
          }),
        )
        if (!cancelled) setContactOptions(nextOptions)
      } catch {
        if (!cancelled) setContactOptions([])
      }
    }

    void hydrateContacts()
    return () => {
      cancelled = true
    }
  }, [
    contactRoleLabels,
    contactsSection,
    getDek,
    privateKeyB64,
    publicKeyB64,
    vault,
  ])

  const contactsById = useMemo(
    () => Object.fromEntries(contactOptions.map((contact) => [contact.id, contact])),
    [contactOptions],
  )

  return { contactOptions, contactsById }
}
