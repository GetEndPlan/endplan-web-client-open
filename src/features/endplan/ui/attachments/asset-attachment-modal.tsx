import { Card, ModalOverlay } from '@/shared/ui'
import type {
  AttachmentDocumentPickerFile,
  AttachmentDocumentPickerFolder,
} from '../../model/attachment-document-picker-tree'
import { AssetAttachmentDocumentPickerPanel } from './asset-attachment-document-picker-panel'

type AssetAttachmentModalProps = {
  title: string
  isBusy?: boolean
  hasValue: boolean
  existingDocumentName?: string | null
  documentsFolders: AttachmentDocumentPickerFolder[]
  documentsFiles: AttachmentDocumentPickerFile[]
  canManageDocuments: boolean
  onClose: () => void
  onLinkDocument: (file: AttachmentDocumentPickerFile) => void
  onCreateDocumentsFolder: (name: string, parentFolderId: string | null) => Promise<string | null>
  onUploadDocumentToFolder: (
    folderId: string,
    file: File,
  ) => Promise<{ id: string; name: string; folderId: string | null } | null>
  onDownloadCurrent?: () => void
  onDeleteCurrent?: () => void
}

export function AssetAttachmentModal({
  title,
  isBusy = false,
  hasValue,
  existingDocumentName,
  documentsFolders,
  documentsFiles,
  canManageDocuments,
  onClose,
  onLinkDocument,
  onCreateDocumentsFolder,
  onUploadDocumentToFolder,
  onDownloadCurrent,
  onDeleteCurrent,
}: AssetAttachmentModalProps) {
  return (
    <ModalOverlay onBackdropClick={onClose}>
      <Card className="w-full max-w-[60rem] overflow-hidden p-0">
        <AssetAttachmentDocumentPickerPanel
          variant="modal"
          title={title}
          onHeaderClose={onClose}
          isBusy={isBusy}
          hasValue={hasValue}
          existingDocumentName={existingDocumentName}
          documentsFolders={documentsFolders}
          documentsFiles={documentsFiles}
          canManageDocuments={canManageDocuments}
          onLinkDocument={onLinkDocument}
          onCreateDocumentsFolder={onCreateDocumentsFolder}
          onUploadDocumentToFolder={onUploadDocumentToFolder}
          onDownloadCurrent={onDownloadCurrent}
          onDeleteCurrent={onDeleteCurrent}
          onCancel={onClose}
        />
      </Card>
    </ModalOverlay>
  )
}
