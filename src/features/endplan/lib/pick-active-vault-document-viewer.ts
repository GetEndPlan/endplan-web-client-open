import type { VaultDocumentViewerState } from '../hooks/documents/use-vault-document-viewer'

const CLOSED_VAULT_DOCUMENT_VIEWER: VaultDocumentViewerState = {
  isOpen: false,
  file: null,
  blob: null,
  isLoading: false,
  isDownloadOnly: false,
  error: null,
  onClose: () => {},
  onDownload: () => {},
}

export function pickActiveVaultDocumentViewer(
  ...viewers: VaultDocumentViewerState[]
): VaultDocumentViewerState {
  return viewers.find((viewer) => viewer.isOpen) ?? CLOSED_VAULT_DOCUMENT_VIEWER
}
