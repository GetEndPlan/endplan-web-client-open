export type {
  InstructionItem,
  InstructionStep,
  InstructionType,
  InstructionsSectionPayload,
} from './instructions'
export {
  CONTACT_ROLES,
  CONTACT_ROLE_SUGGESTIONS,
  contactInitials,
  contactRoleDisplayLabel,
  emptyContactsPayload,
  normalizeContactsPayload,
} from './contacts'
export type {
  ContactFormInput,
  ContactItem,
  ContactRole,
  ContactRoleFilter,
  ContactsSectionPayload,
  ContactUpsertResult,
} from './contacts'
export {
  ATTACHMENT_DOCUMENT_PICKER_ROOT_PARENT_KEY,
  attachmentDocumentPickerFolderAncestorIds,
  attachmentDocumentPickerFolderParentKey,
  buildAttachmentDocumentPickerIndices,
  countAttachmentDocumentFilesInFolderSubtree,
  filterAttachmentDocumentPickerFilesByQuery,
  isAttachmentDocumentFileInFolderSubtree,
  type AttachmentDocumentPickerFile,
  type AttachmentDocumentPickerFolder,
  type AttachmentDocumentPickerIndices,
} from './attachment-document-picker-tree'
export { getSharedVaultRoleLabel, getSharedVaultRoleDescription } from './shared-vault-role'
export { getSharedVaultDisplayName } from './shared-vault-display-name'
export {
  getSharedVaultSidebarBlockedKind,
  type SharedVaultSidebarBlockedKind,
} from './shared-vault-sidebar-blocked'
export type { InstructionFormState } from './instructions-form-state'
export {
  ROOT_FOLDER_KEY,
  buildDeleteFolderMoveDestinationOptions,
  buildFolderByIdMap,
  collectSubtreeFolderIds,
  filterItemsByNameQuery,
  flattenFoldersFromParentMap,
  getChildFoldersForParent,
  getFileIdsInFolderSubtree,
  getFolderPathLabel,
  hasTopLevelFolders,
  sortByCreatedAt,
} from './vault-documents-tree'
export type {
  DocumentsDriveViewMode,
  FolderParentKey,
  FoldersByParent,
} from './vault-documents-tree'
export {
  canCreateDocumentFolder,
  canUploadAtLeastOneDocumentFile,
  checkFileUploadsAgainstPlan,
  checkFolderCreateAgainstPlan,
  documentsPlanLimitsFromFeatures,
  resolveDocumentsPlanLimits,
} from './vault-documents-plan-guards'
export type {
  DocumentsPlanLimitsSnapshot,
  FileUploadPlanBlock,
  FolderCreatePlanBlock,
} from './vault-documents-plan-guards'
export {
  blankInstructionFormState,
  formatInstructionUpdatedLabel,
  formatInstructionRelativeUpdatedLabel,
  instructionItemToFormState,
} from './instructions-form-state'
export { DOCUMENT_SUGGESTIONS } from './document-suggestions'
export type { DocumentSuggestion, DocumentSuggestionId } from './document-suggestions'
export { INSTRUCTION_TEMPLATES } from './instruction-templates'
export type {
  InstructionTemplate,
  InstructionTemplateDraft,
  InstructionTemplateId,
} from './instruction-templates'
export type {
  InstructionAssetOption,
  InstructionContactOption,
  InstructionDocumentFolderOption,
  InstructionDocumentOption,
  InstructionLinkedDocument,
} from './instructions-page.types'
export {
  formatAllowedDocumentTypeLabels,
} from './document-upload-policy'
export {
  activitySummaryItemLabel,
  isVisibleRecentActivityItem,
  resolveActivityTagKind,
  resolveActivityTimestamp,
} from './activity-display'
export { isVisibleVaultSectionType } from './vault-section-types'
export type { ActivityTagKind, ActivityTimestamp } from './activity-display'
export {
  assetRowHasUserInput,
  countFilledAssetRowsInCategories,
} from './asset-table-model'
export {
  clearAllPendingAssetsAutosaveSnapshots,
  clearPendingAssetsAutosaveSnapshot,
} from './assets-autosave-queue'
export {
  countSectionContentItems,
} from './section-content-counts'
export type { SectionContentPayload } from './section-content-counts'
