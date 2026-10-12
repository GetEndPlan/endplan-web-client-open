import type { AssetSchemaCategory } from '../../api/clients/vault-api'
import type {
  DecryptedVaultPolicyAttachment,
  DecryptedVaultDocumentFileForPolicies,
  DecryptedVaultDocumentFolderForPolicies,
} from '../../hooks/policies/use-vault-policies-page'
import type { VaultDocumentViewerState } from '../../hooks/documents/use-vault-document-viewer'

export type VaultPoliciesCustomFieldDraft = {
  fieldType:
    | 'text'
    | 'textarea'
    | 'number'
    | 'value'
    | 'date'
    | 'select'
    | 'attachment'
    | 'password'
    | 'contact'
}

export const defaultVaultPoliciesCustomFieldDraft: VaultPoliciesCustomFieldDraft = {
  fieldType: 'text',
}

export type VaultPoliciesTableProps = {
  categories: AssetSchemaCategory[]
  selectedCategoryIds: string[]
  setSelectedCategoryIds: (ids: string[]) => void
  canPersistAssets: boolean
  policyCategoriesMax: number
  assetRowsPerCategoryMax: number
  isSavingCategories: boolean
  isSavingAssets: boolean
  isAddingCustomField: boolean
  isDeletingCustomField: boolean
  isDeletingCustomCategory: boolean
  isCreatingCustomCategory: boolean
  isUpdatingCustomCategory: boolean
  isUpdatingField: boolean
  isAttachmentsLoading: boolean
  autosaveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error'
  lastSavedAt: number | null
  saveApiCallCount: number
  isOffline: boolean
  getRows: (categoryTemplateId: string) => Array<{ id: string; values: Record<string, string> }>
  setCellValue: (categoryTemplateId: string, rowId: string, fieldKey: string, value: string) => void
  onEditorActivityChange: (active: boolean) => void
  addRow: (categoryTemplateId: string, fieldKeys: string[]) => string
  removeRow: (categoryTemplateId: string, rowId: string) => void
  onPersistSelectedCategories: (ids?: string[]) => Promise<boolean>
  onCreateCustomCategory: (
    name: string,
    options?: { insertPosition?: 'start' | 'end' },
  ) => Promise<boolean>
  onAddCustomField: (input: {
    categoryTemplateId: string
    key?: string
    label: string
    fieldType?:
      | 'text'
      | 'textarea'
      | 'number'
      | 'value'
      | 'date'
      | 'select'
      | 'attachment'
      | 'password'
      | 'contact'
  }) => Promise<boolean>
  onDeleteCustomField: (input: {
    fieldId: string
    categoryTemplateId: string
    fieldKey: string
  }) => Promise<boolean>
  onRenameField: (input: { fieldId: string; label: string }) => Promise<boolean>
  onRenameCustomCategory: (input: { categoryId: string; name: string }) => Promise<boolean>
  onDeleteCustomCategory: (categoryId: string) => Promise<boolean>
  attachmentsById: Record<string, DecryptedVaultPolicyAttachment>
  documentsFolders: DecryptedVaultDocumentFolderForPolicies[]
  documentsFiles: DecryptedVaultDocumentFileForPolicies[]
  documentsFilesById: Record<string, DecryptedVaultDocumentFileForPolicies>
  activeAttachmentCellKey: string | null
  onUploadAttachment: (input: {
    categoryTemplateId: string
    rowId: string
    fieldKey: string
    file: File
  }) => Promise<boolean>
  onDownloadAttachment: (attachment: DecryptedVaultPolicyAttachment) => Promise<boolean>
  onDownloadLinkedDocument: (file: DecryptedVaultDocumentFileForPolicies) => Promise<boolean>
  onViewLinkedDocument: (file: DecryptedVaultDocumentFileForPolicies) => Promise<boolean>
  onViewAttachment: (attachment: DecryptedVaultPolicyAttachment) => Promise<boolean>
  documentViewer: VaultDocumentViewerState
  onLinkDocument: (input: {
    categoryTemplateId: string
    rowId: string
    fieldKey: string
    file: {
      id: string
      name: string
      folderId?: string | null
    }
  }) => Promise<boolean>
  onClearAttachment: (input: { categoryTemplateId: string; rowId: string; fieldKey: string }) => void
  contactOptions: Array<{ id: string; label: string; subtitle: string }>
  contactsById: Record<string, { id: string; label: string; subtitle: string }>
  onLinkContact: (input: {
    categoryTemplateId: string
    rowId: string
    fieldKey: string
    contact: { id: string; label: string }
  }) => Promise<boolean>
  onClearContact: (input: { categoryTemplateId: string; rowId: string; fieldKey: string }) => void
  canManageDocuments: boolean
  onCreateDocumentsFolder: (name: string, parentFolderId: string | null) => Promise<string | null>
  onUploadDocumentToFolder: (
    folderId: string,
    file: File,
  ) => Promise<{ id: string; name: string; folderId: string | null } | null>
  isVaultDocumentsActionBusy: boolean
}
