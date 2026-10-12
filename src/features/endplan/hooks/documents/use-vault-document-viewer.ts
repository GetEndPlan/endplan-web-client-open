import { useCallback, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import type { ApiError } from '@/shared/api/client'
import { toast } from '@/shared/ui'
import { decryptVaultDocumentToBlob } from '../../lib/decrypt-vault-document-blob'
import { getDocumentViewerCapability } from '../../model/document-viewer-capabilities'

type VaultDocumentDecryptContext = {
  id: string
  ownerId: string
}

export type DecryptVaultViewerFileToBlob<TFile extends VaultDocumentViewerFile> = (args: {
  vault: VaultDocumentDecryptContext
  file: TFile
  getDek: () => Promise<Uint8Array | null>
}) => Promise<Blob>

export type VaultDocumentViewerFile = {
  id: string
  name: string
  mimeType?: string | null
  fileIv?: string | null
}

type VaultDocumentViewerContext = VaultDocumentDecryptContext

type ViewerState<TFile extends VaultDocumentViewerFile> = {
  isOpen: boolean
  file: TFile | null
  blob: Blob | null
  isLoading: boolean
  isDownloadOnly: boolean
  error: string | null
}

export type VaultDocumentViewerState<TFile extends VaultDocumentViewerFile = VaultDocumentViewerFile> = {
  isOpen: boolean
  file: TFile | null
  blob: Blob | null
  isLoading: boolean
  isDownloadOnly: boolean
  error: string | null
  onClose: () => void
  onDownload: () => void
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'apiMessage' in error) {
    const apiMessage = (error as ApiError).apiMessage
    if (apiMessage) return apiMessage
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

const INITIAL_VIEWER_STATE = {
  isOpen: false,
  file: null,
  blob: null,
  isLoading: false,
  isDownloadOnly: false,
  error: null,
} satisfies Omit<ViewerState<VaultDocumentViewerFile>, 'file'> & { file: null }

export function useVaultDocumentViewer<TFile extends VaultDocumentViewerFile>(args: {
  vault: VaultDocumentViewerContext | null | undefined
  getDek: () => Promise<Uint8Array | null>
  downloadFile: (file: TFile) => Promise<boolean>
  decryptToBlob?: DecryptVaultViewerFileToBlob<TFile>
  t: TFunction
}) {
  const { vault, getDek, downloadFile, decryptToBlob = decryptVaultDocumentToBlob, t } = args
  const [viewerState, setViewerState] = useState<ViewerState<TFile>>(INITIAL_VIEWER_STATE)
  const openRequestIdRef = useRef(0)

  const closeViewer = useCallback(() => {
    openRequestIdRef.current += 1
    setViewerState(INITIAL_VIEWER_STATE)
  }, [])

  const viewDocumentFile = useCallback(
    async (file: TFile) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      if (!file.fileIv) {
        toast.error(t('vault.documentsManager.viewFileNotReadyError'))
        return false
      }

      const requestId = openRequestIdRef.current + 1
      openRequestIdRef.current = requestId

      const capability = getDocumentViewerCapability(file.mimeType, file.name)
      const isDownloadOnly = capability === 'download-only'

      setViewerState({
        isOpen: true,
        file,
        blob: null,
        isLoading: !isDownloadOnly,
        isDownloadOnly,
        error: null,
      })

      if (isDownloadOnly) {
        return true
      }

      try {
        const blob = await decryptToBlob({
          vault,
          file,
          getDek,
        })

        if (openRequestIdRef.current !== requestId) {
          return true
        }

        setViewerState({
          isOpen: true,
          file,
          blob,
          isLoading: false,
          isDownloadOnly: false,
          error: null,
        })
        return true
      } catch (error) {
        if (openRequestIdRef.current !== requestId) {
          return false
        }

        const message = getErrorMessage(error, t('vault.documentsManager.viewOpenFailedError'))
        setViewerState({
          isOpen: true,
          file,
          blob: null,
          isLoading: false,
          isDownloadOnly: false,
          error: message,
        })
        toast.error(message)
        return false
      }
    },
    [decryptToBlob, getDek, t, vault],
  )

  const handleDownload = useCallback(() => {
    if (!viewerState.file) return
    void downloadFile(viewerState.file)
  }, [downloadFile, viewerState.file])

  const documentViewer: VaultDocumentViewerState<TFile> = {
    isOpen: viewerState.isOpen,
    file: viewerState.file,
    blob: viewerState.blob,
    isLoading: viewerState.isLoading,
    isDownloadOnly: viewerState.isDownloadOnly,
    error: viewerState.error,
    onClose: closeViewer,
    onDownload: handleDownload,
  }

  return {
    viewDocumentFile,
    documentViewer,
  }
}
