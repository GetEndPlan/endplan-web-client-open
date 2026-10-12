import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useKeyMaterial } from '@/features/keys'
import {
  decryptPolicyAttachmentFile,
  decryptPolicyAttachmentName,
  unwrapDekWithKeyPair,
} from '@/shared/lib'
import { useVault, useVaultPolicyAttachments, useVaultPoliciesSchema } from '../../api/hooks/queries/use-vault-queries'
import { vaultPoliciesApi } from '../../api/clients/vault-api'
import { getAttachmentFieldKeysByCategory, getPasswordFieldKeysByCategory } from '../../model/asset-attachment-ref'
import type { DecryptedVaultPolicyAttachment } from '../policies/use-vault-policies-page'
import { useVaultDocumentViewer } from '../documents/use-vault-document-viewer'
import { decryptVaultPolicyAttachmentToBlob } from '../../lib/decrypt-vault-policy-attachment-blob'

export function useSharedPoliciesReadOnly(vaultId: string) {
  const { t } = useTranslation()
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial()
  const { data: vault } = useVault(vaultId, { enabled: !!vaultId })
  const { data: schema, isLoading: isSchemaLoading } = useVaultPoliciesSchema(vaultId, { enabled: !!vaultId })
  const attachmentsQuery = useVaultPolicyAttachments(vaultId, { enabled: !!vaultId })

  const [decryptedAttachments, setDecryptedAttachments] = useState<DecryptedVaultPolicyAttachment[]>([])

  const attachmentFieldKeysByCategory = useMemo(
    () => getAttachmentFieldKeysByCategory(schema?.categories ?? []),
    [schema?.categories],
  )
  const passwordFieldKeysByCategory = useMemo(
    () => getPasswordFieldKeysByCategory(schema?.categories ?? []),
    [schema?.categories],
  )

  const attachmentsById = useMemo(() => {
    if (!vault || !attachmentsQuery.data) return {}
    return Object.fromEntries(
      decryptedAttachments.map((attachment) => [attachment.id, attachment]),
    ) as Record<string, DecryptedVaultPolicyAttachment>
  }, [attachmentsQuery.data, decryptedAttachments, vault])

  const getDek = useCallback(async () => {
    if (!vault || !vault.wrappedDek || !publicKeyB64 || !privateKeyB64) return null
    return unwrapDekWithKeyPair(vault.wrappedDek, publicKeyB64, privateKeyB64, pqPrivateKeyB64, {
      vaultId: vault.id,
    })
  }, [privateKeyB64, pqPrivateKeyB64, publicKeyB64, vault])

  useEffect(() => {
    if (!vault || !attachmentsQuery.data) return
    const attachments = Array.isArray(attachmentsQuery.data.attachments)
      ? attachmentsQuery.data.attachments
      : []
    let cancelled = false

    getDek()
      .then(async (dek) => {
        if (!dek) return null
        return Promise.all(
          attachments.map(async (attachment) => ({
            ...attachment,
            name: await decryptPolicyAttachmentName(
              attachment.encryptedName,
              attachment.nameIv,
              dek,
              vault.id,
              vault.ownerId,
            ),
          })),
        )
      })
      .then((decoded) => {
        if (cancelled) return
        const list =
          decoded ??
          attachments.map((attachment) => ({
            ...attachment,
            name: t('vault.policies.attachments.encryptedFallbackName'),
          }))
        setDecryptedAttachments(list)
      })
      .catch(() => {
        if (cancelled) return
        const list = (Array.isArray(attachmentsQuery.data?.attachments)
          ? attachmentsQuery.data.attachments
          : []
        ).map((attachment) => ({
          ...attachment,
          name: t('vault.policies.attachments.encryptedFallbackName'),
        }))
        setDecryptedAttachments(list)
      })

    return () => { cancelled = true }
  }, [attachmentsQuery.data, getDek, t, vault])

  const downloadAttachment = useCallback(
    async (attachment: DecryptedVaultPolicyAttachment) => {
      if (!vault || !attachment.fileIv) return false
      const dek = await getDek()
      if (!dek) return false
      const payload = await vaultPoliciesApi.getAttachmentDownloadURL(vault.id, attachment.id)
      const encryptedRes = await fetch(payload.downloadUrl)
      if (!encryptedRes.ok) return false
      const encryptedBytes = new Uint8Array(await encryptedRes.arrayBuffer())
      const decrypted = await decryptPolicyAttachmentFile(
        encryptedBytes,
        payload.attachment.fileIv ?? attachment.fileIv,
        dek,
        vault.id,
        vault.ownerId,
      )
      const blob = new Blob([new Uint8Array(decrypted)], {
        type: attachment.mimeType || 'application/octet-stream',
      })
      const objectURL = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectURL
      link.download = attachment.name || t('vault.policies.attachments.downloadNameFallback')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.setTimeout(() => URL.revokeObjectURL(objectURL), 500)
      return true
    },
    [getDek, t, vault],
  )

  const { viewDocumentFile: viewAttachment, documentViewer } = useVaultDocumentViewer<DecryptedVaultPolicyAttachment>({
    vault,
    getDek,
    downloadFile: downloadAttachment,
    decryptToBlob: decryptVaultPolicyAttachmentToBlob,
    t,
  })

  return {
    selectedCategoryIds: schema?.selectedCategoryIds ?? [],
    isSchemaLoaded: !isSchemaLoading && schema != null,
    attachmentFieldKeysByCategory,
    passwordFieldKeysByCategory,
    attachmentsById,
    downloadAttachment,
    viewAttachment,
    documentViewer,
  }
}
