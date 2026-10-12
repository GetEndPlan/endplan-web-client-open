/**
 * View-model types shared by the vault instructions page hook and UI.
 * Single source of truth to avoid drift between `useVaultInstructionsPage` and `VaultInstructionsPage`.
 */

import type { InstructionFormState } from './instructions-form-state'

export type InstructionUpsertResult = { success: true; savedInstructionId: string } | { success: false }

export type InstructionUpsertHandler = (input: InstructionFormState) => Promise<InstructionUpsertResult>

export type InstructionAssetOption = {
  id: string
  label: string
  subtitle: string
}

export type InstructionContactOption = {
  id: string
  label: string
  subtitle: string
}

export type InstructionDocumentOption = {
  id: string
  name: string
  subtitle: string
  sizeBytes: number
  folderId: string | null
  mimeType?: string | null
  uploadedAt?: string | null
  fileIv?: string | null
}

export type InstructionDocumentFolderOption = {
  id: string
  name: string
  parentFolderId: string | null
}

/** Result of uploading a document from the instructions flow (picker / attach). */
export type InstructionLinkedDocument = {
  id: string
  name: string
  folderId: string | null
}
