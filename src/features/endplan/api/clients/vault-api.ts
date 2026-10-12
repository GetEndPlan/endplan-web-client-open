import { api } from '@/shared/api'

export type UserRole = 'user' | 'key_person' | 'recipient' | 'advisor'
export type AccessLevel = 'full' | 'partial' | 'read_only'

export type CreateVaultRequest = {
  name?: string
  description?: string
  encryptedData: string
  encryptionIv: string
  wrappedDek: string
  wrappedDekReleaseB64?: string // DEK wrapped with release service public key (for deferred release)
}

export type UpdateVaultRequest = {
  name?: string
  description?: string
  encryptedData?: string
  encryptionIv?: string
  wrappedDekReleaseB64?: string // DEK wrapped for release service (for enabling deferred release)
}

export type VaultResponse = {
  id: string
  ownerId: string
  name: string
  description?: string
  /** Present when API uses inline storage; empty when blobUrl is set (S3) */
  encryptedData?: string
  encryptionIv: string
  dataHash?: string // For client integrity check when using blobUrl
  /** Signed URL when blob stored in S3; client fetches to get ciphertext */
  blobUrl?: string
  wrappedDek: string
  wrappedDekReleaseB64?: string // DEK wrapped for release service
  version: number
  createdAt: string
  updatedAt: string
}

export type VaultListItem = {
  id: string
  ownerId: string
  name: string
  description?: string
  version: number
  createdAt: string
  updatedAt: string
}

export type VaultListResponse = {
  vaults: VaultListItem[]
}

/** Why sections are hidden when sectionsVisible is false (see API shared-vaults). */
export type SharedVaultSectionsHiddenReason =
  | 'post_release_recovery'
  | 'awaiting_key_share'
  | 'deferred_grant'

export type SharedVault = {
  id: string
  name: string
  description?: string
  ownerName: string
  ownerEmail: string
  role: UserRole
  accessLevel: AccessLevel
  wrappedDek: string
  /** For recipients/advisors, whether shared content is exposed in this payload. Key persons: use sharedVaultDecryptFlowEnabled (grant + wrappedDek). */
  sectionsVisible?: boolean
  sectionsHiddenReason?: SharedVaultSectionsHiddenReason
  accessGrantStatus?: 'available' | 'deferred'
  inactivityPeriodDays?: number
  expiresAt?: string
  grantedAt: string
  /** Section types granted on trusted-circle membership; drives client nav without extra API calls. */
  allowedSectionTypes?: string[]
}

export type SharedVaultListResponse = {
  vaults: SharedVault[]
}

/**
 * Whether to load vault ciphertext, section list, and run shared decrypt for this entry.
 * Key persons: accessGrantStatus + wrappedDek (not sectionsVisible — that flag is for owner/recipient UX).
 * If the list payload includes sectionsHiddenReason (deferred_grant, awaiting_key_share, etc.), shared
 * sections are off regardless of other fields.
 */
export function sharedVaultDecryptFlowEnabled(v: SharedVault | null | undefined): boolean {
  if (!v) return false
  if (v.role === 'key_person') {
    if (v.sectionsHiddenReason?.trim()) {
      return false
    }
    return v.accessGrantStatus === 'available' && !!v.wrappedDek?.trim()
  }
  return v.sectionsVisible !== false
}

type MembershipLike = {
  status: string
  role: string
  accessTiming?: string
  accessGrantStatus?: string
  member?: { email?: string }
}

/**
 * For in-end key persons, require both shared-vaults list AND trusted-circle membership
 * to show grant available. Stops decrypt if the list is stale after owner restore (membership
 * often refetches independently).
 */
export function sharedVaultDecryptFlowEnabledWithMembership(
  vault: SharedVault | null | undefined,
  memberships: MembershipLike[],
): boolean {
  if (!vault) return false
  if (vault.role !== 'key_person') {
    return sharedVaultDecryptFlowEnabled(vault)
  }
  const listOk = sharedVaultDecryptFlowEnabled(vault)
  const ownerEmail = vault.ownerEmail.trim().toLowerCase()
  const row = memberships.find(
    (m) =>
      m.status === 'active' &&
      m.role === 'key_person' &&
      m.accessTiming === 'in_end' &&
      (m.member?.email?.trim().toLowerCase() ?? '') === ownerEmail,
  )
  if (!row) {
    return listOk
  }
  const membershipOk = row.accessGrantStatus === 'available' && !!vault.wrappedDek?.trim()
  return listOk && membershipOk
}

export const vaultApi = {
  /**
   * Create a new vault (EndPlan)
   */
  async create(data: CreateVaultRequest): Promise<VaultResponse> {
    return api.post<VaultResponse>('/api/v1/vaults', data)
  },

  /**
   * Get all vaults owned by the current user
   */
  async listOwned(): Promise<VaultListResponse> {
    return api.get<VaultListResponse>('/api/v1/vaults')
  },

  /**
   * Get all vaults shared with the current user
   */
  async listShared(): Promise<SharedVaultListResponse> {
    return api.get<SharedVaultListResponse>('/api/v1/shared-vaults')
  },

  /**
   * Get a vault by ID with encrypted data
   */
  async getById(id: string): Promise<VaultResponse> {
    return api.get<VaultResponse>(`/api/v1/vaults/${id}`)
  },

  /**
   * Update a vault
   */
  async update(id: string, data: UpdateVaultRequest): Promise<VaultResponse> {
    return api.put<VaultResponse>(`/api/v1/vaults/${id}`, data)
  },

  /**
   * Delete a vault
   */
  async delete(id: string): Promise<void> {
    return api.delete(`/api/v1/vaults/${id}`)
  },
}

// ==================== Vault Sections ====================

export type CreateVaultSectionRequest = {
  sectionType: string
  sectionName: string
  displayOrder?: number
  encryptedData: string
  encryptionIv: string
  assetCategoryRowCounts?: Record<string, number>
  policyCategoryRowCounts?: Record<string, number>
}

export type UpdateVaultSectionRequest = {
  sectionName?: string
  displayOrder?: number
  encryptedData?: string
  encryptionIv?: string
  expectedVersion?: number
  assetCategoryRowCounts?: Record<string, number>
  policyCategoryRowCounts?: Record<string, number>
  itemCount?: number
  /** Hint for activity feed: "added" | "updated" */
  activityChange?: 'added' | 'updated'
}

export type VaultSectionResponse = {
  id: string
  vaultId: string
  sectionType: string
  sectionName: string
  displayOrder: number
  /** Present when API uses inline storage; empty when blobUrl is set (S3) */
  encryptedData?: string
  encryptionIv: string
  dataHash?: string // For client integrity check when using blobUrl
  /** Signed URL when blob stored in S3; client fetches to get ciphertext */
  blobUrl?: string
  version: number
  createdAt: string
  updatedAt: string
  wrappedDek?: string
}

export type VaultSectionListResponse = {
  sections: VaultSectionResponse[]
}

export type VaultDocumentFolder = {
  id: string
  vaultId?: string
  sectionId?: string
  parentFolderId?: string | null
  encryptedName: string
  nameIv: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type VaultDocumentFile = {
  id: string
  vaultId?: string
  sectionId?: string
  folderId?: string | null
  encryptedName: string
  nameIv: string
  mimeType?: string | null
  originalSizeBytes: number
  encryptedSizeBytes?: number | null
  fileIv?: string | null
  isUploaded: boolean
  uploadedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type VaultDocumentsTreeResponse = {
  vaultId: string
  sectionId: string
  folders: VaultDocumentFolder[]
  files: VaultDocumentFile[]
}

export type CreateVaultDocumentFolderRequest = {
  parentFolderId?: string
  encryptedName: string
  nameIv: string
}

export type UpdateVaultDocumentFolderRequest = {
  encryptedName: string
  nameIv: string
}

export type UpdateVaultDocumentFileRequest = {
  encryptedName?: string
  nameIv?: string
  folderId?: string
}

export type InitVaultDocumentUploadRequest = {
  folderId?: string
  encryptedName: string
  nameIv: string
  mimeType?: string
  originalSizeBytes: number
}

export type InitVaultDocumentUploadResponse = {
  file: VaultDocumentFile
  uploadUrl: string
}

export type CompleteVaultDocumentUploadRequest = {
  fileIv: string
  encryptedSizeBytes: number
}

export type VaultDocumentDownloadResponse = {
  file: VaultDocumentFile
  downloadUrl: string
}

export type AssetSchemaField = {
  id: string
  key: string
  label: string
  fieldType: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'attachment' | string
  required: boolean
  displayOrder: number
  source: 'template' | 'custom' | string
  options?: string[]
}

export type AssetSchemaCategory = {
  id: string
  key: string
  name: string
  description?: string
  displayOrder: number
  /** Lower values appear first in the assets suggestions panel. 0 means not suggested. */
  suggestionOrder?: number
  isActive: boolean
  source?: 'template' | 'custom' | string
  isSelected?: boolean
  /** May be omitted by the API when a category has no fields. */
  fields?: AssetSchemaField[]
}

export type VaultAssetSchemaResponse = {
  vaultId: string
  categories: AssetSchemaCategory[]
  selectedCategoryIds: string[]
  assetCategoriesMax: number
  policyCategoriesMax?: number
}

export type UpdateVaultAssetCategoriesRequest = {
  categoryTemplateIds: string[]
}

export type AddVaultAssetCustomFieldRequest = {
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
  required?: boolean
  displayOrder?: number
  options?: string[]
}

export type AddVaultAssetCustomFieldResponse = {
  id: string
  vaultId: string
  categoryTemplateId: string
  key: string
  label: string
  fieldType: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'attachment' | string
  required: boolean
  displayOrder: number
  options?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreateVaultAssetCustomCategoryRequest = {
  name: string
}

export type CreateVaultAssetCustomCategoryResponse = {
  category: AssetSchemaCategory
  selectedCategoryIds: string[]
}

export type UpdateVaultAssetCustomCategoryRequest = {
  name: string
}

export type UpdateVaultAssetCustomCategoryResponse = AssetSchemaCategory

export type UpdateVaultAssetFieldRequest = {
  label?: string
}

export type UpdateVaultAssetFieldResponse = {
  id: string
  vaultId: string
  categoryTemplateId: string
  key: string
  label: string
  fieldType: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'attachment' | string
  required: boolean
  displayOrder: number
  options?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type VaultAssetAttachment = {
  id: string
  categoryTemplateId: string
  rowId: string
  fieldKey: string
  encryptedName: string
  nameIv: string
  mimeType?: string | null
  originalSizeBytes: number
  encryptedSizeBytes?: number | null
  fileIv?: string | null
  isUploaded: boolean
  uploadedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type VaultAssetAttachmentsResponse = {
  vaultId: string
  sectionId: string
  attachments: VaultAssetAttachment[]
}

export type InitVaultAssetAttachmentUploadRequest = {
  categoryTemplateId: string
  rowId: string
  fieldKey: string
  encryptedName: string
  nameIv: string
  mimeType?: string
  originalSizeBytes: number
}

export type InitVaultAssetAttachmentUploadResponse = {
  attachment: VaultAssetAttachment
  uploadUrl: string
}

export type CompleteVaultAssetAttachmentUploadRequest = {
  fileIv: string
  encryptedSizeBytes: number
}

export type VaultAssetAttachmentDownloadResponse = {
  attachment: VaultAssetAttachment
  downloadUrl: string
}

export type UpdateVaultAssetCategoriesResponse = {
  selectedCategoryIds: string[]
}

export const vaultSectionApi = {
  list(vaultId: string): Promise<VaultSectionListResponse> {
    return api.get<VaultSectionListResponse>(`/api/v1/vaults/${vaultId}/sections`)
  },

  create(vaultId: string, data: CreateVaultSectionRequest): Promise<VaultSectionResponse> {
    return api.post<VaultSectionResponse>(`/api/v1/vaults/${vaultId}/sections`, data)
  },

  getById(vaultId: string, sectionId: string): Promise<VaultSectionResponse> {
    return api.get<VaultSectionResponse>(`/api/v1/vaults/${vaultId}/sections/${sectionId}`)
  },

  update(
    vaultId: string,
    sectionId: string,
    data: UpdateVaultSectionRequest,
  ): Promise<VaultSectionResponse> {
    return api.put<VaultSectionResponse>(`/api/v1/vaults/${vaultId}/sections/${sectionId}`, data)
  },

  delete(vaultId: string, sectionId: string): Promise<void> {
    return api.delete(`/api/v1/vaults/${vaultId}/sections/${sectionId}`)
  },
}

export const vaultInstructionsApi = {
  get(vaultId: string): Promise<VaultSectionResponse> {
    return api.get<VaultSectionResponse>(`/api/v1/vaults/${vaultId}/instructions`)
  },
  upsert(vaultId: string, data: UpdateVaultSectionRequest): Promise<VaultSectionResponse> {
    return api.put<VaultSectionResponse>(`/api/v1/vaults/${vaultId}/instructions`, data)
  },
  delete(vaultId: string): Promise<void> {
    return api.delete(`/api/v1/vaults/${vaultId}/instructions`)
  },
}

export const vaultContactsApi = {
  get(vaultId: string): Promise<VaultSectionResponse> {
    return api.get<VaultSectionResponse>(`/api/v1/vaults/${vaultId}/contacts`)
  },
  upsert(vaultId: string, data: UpdateVaultSectionRequest): Promise<VaultSectionResponse> {
    return api.put<VaultSectionResponse>(`/api/v1/vaults/${vaultId}/contacts`, data)
  },
  delete(vaultId: string): Promise<void> {
    return api.delete(`/api/v1/vaults/${vaultId}/contacts`)
  },
}

export const vaultDocumentsApi = {
  getTree(vaultId: string): Promise<VaultDocumentsTreeResponse> {
    return api.get<VaultDocumentsTreeResponse>(`/api/v1/vaults/${vaultId}/documents/tree`)
  },

  createFolder(
    vaultId: string,
    data: CreateVaultDocumentFolderRequest,
  ): Promise<VaultDocumentFolder> {
    return api.post<VaultDocumentFolder>(`/api/v1/vaults/${vaultId}/documents/folders`, data)
  },

  updateFolder(
    vaultId: string,
    folderId: string,
    data: UpdateVaultDocumentFolderRequest,
  ): Promise<VaultDocumentFolder> {
    return api.patch<VaultDocumentFolder>(
      `/api/v1/vaults/${vaultId}/documents/folders/${folderId}`,
      data,
    )
  },

  deleteFolder(
    vaultId: string,
    folderId: string,
  ): Promise<{ deletedFolders: number; deletedFiles: number }> {
    return api.delete<{ deletedFolders: number; deletedFiles: number }>(
      `/api/v1/vaults/${vaultId}/documents/folders/${folderId}`,
    )
  },

  initUpload(
    vaultId: string,
    data: InitVaultDocumentUploadRequest,
  ): Promise<InitVaultDocumentUploadResponse> {
    return api.post<InitVaultDocumentUploadResponse>(
      `/api/v1/vaults/${vaultId}/documents/files/init-upload`,
      data,
    )
  },

  updateFile(
    vaultId: string,
    fileId: string,
    data: UpdateVaultDocumentFileRequest,
  ): Promise<VaultDocumentFile> {
    return api.patch<VaultDocumentFile>(`/api/v1/vaults/${vaultId}/documents/files/${fileId}`, data)
  },

  completeUpload(
    vaultId: string,
    fileId: string,
    data: CompleteVaultDocumentUploadRequest,
  ): Promise<VaultDocumentFile> {
    return api.post<VaultDocumentFile>(`/api/v1/vaults/${vaultId}/documents/files/${fileId}/complete`, data)
  },

  getDownloadURL(vaultId: string, fileId: string): Promise<VaultDocumentDownloadResponse> {
    return api.get<VaultDocumentDownloadResponse>(
      `/api/v1/vaults/${vaultId}/documents/files/${fileId}/download-url`,
    )
  },

  deleteFile(vaultId: string, fileId: string): Promise<void> {
    return api.delete(`/api/v1/vaults/${vaultId}/documents/files/${fileId}`)
  },
}

export const vaultAssetsApi = {
  getSchema(vaultId: string): Promise<VaultAssetSchemaResponse> {
    return api.get<VaultAssetSchemaResponse>(`/api/v1/vaults/${vaultId}/assets/schema`)
  },

  updateCategories(
    vaultId: string,
    data: UpdateVaultAssetCategoriesRequest,
  ): Promise<UpdateVaultAssetCategoriesResponse> {
    return api.put<UpdateVaultAssetCategoriesResponse>(`/api/v1/vaults/${vaultId}/assets/categories`, data)
  },

  addCustomField(
    vaultId: string,
    data: AddVaultAssetCustomFieldRequest,
  ): Promise<AddVaultAssetCustomFieldResponse> {
    return api.post<AddVaultAssetCustomFieldResponse>(`/api/v1/vaults/${vaultId}/assets/custom-fields`, data)
  },

  createCustomCategory(
    vaultId: string,
    data: CreateVaultAssetCustomCategoryRequest,
  ): Promise<CreateVaultAssetCustomCategoryResponse> {
    return api.post<CreateVaultAssetCustomCategoryResponse>(
      `/api/v1/vaults/${vaultId}/assets/categories/custom`,
      data,
    )
  },

  updateCustomCategory(
    vaultId: string,
    categoryId: string,
    data: UpdateVaultAssetCustomCategoryRequest,
  ): Promise<UpdateVaultAssetCustomCategoryResponse> {
    return api.patch<UpdateVaultAssetCustomCategoryResponse>(
      `/api/v1/vaults/${vaultId}/assets/categories/custom/${categoryId}`,
      data,
    )
  },

  deleteCustomCategory(
    vaultId: string,
    categoryId: string,
  ): Promise<UpdateVaultAssetCategoriesResponse> {
    return api.delete<UpdateVaultAssetCategoriesResponse>(
      `/api/v1/vaults/${vaultId}/assets/categories/custom/${categoryId}`,
    )
  },

  updateField(
    vaultId: string,
    fieldId: string,
    data: UpdateVaultAssetFieldRequest,
  ): Promise<UpdateVaultAssetFieldResponse> {
    return api.patch<UpdateVaultAssetFieldResponse>(
      `/api/v1/vaults/${vaultId}/assets/fields/${fieldId}`,
      data,
    )
  },

  deleteCustomField(vaultId: string, fieldId: string): Promise<void> {
    return api.delete<void>(`/api/v1/vaults/${vaultId}/assets/custom-fields/${fieldId}`)
  },

  listAttachments(vaultId: string): Promise<VaultAssetAttachmentsResponse> {
    return api.get<VaultAssetAttachmentsResponse>(`/api/v1/vaults/${vaultId}/assets/attachments`)
  },

  initAttachmentUpload(
    vaultId: string,
    data: InitVaultAssetAttachmentUploadRequest,
  ): Promise<InitVaultAssetAttachmentUploadResponse> {
    return api.post<InitVaultAssetAttachmentUploadResponse>(
      `/api/v1/vaults/${vaultId}/assets/attachments/init-upload`,
      data,
    )
  },

  completeAttachmentUpload(
    vaultId: string,
    attachmentId: string,
    data: CompleteVaultAssetAttachmentUploadRequest,
  ): Promise<VaultAssetAttachment> {
    return api.post<VaultAssetAttachment>(
      `/api/v1/vaults/${vaultId}/assets/attachments/${attachmentId}/complete`,
      data,
    )
  },

  getAttachmentDownloadURL(
    vaultId: string,
    attachmentId: string,
  ): Promise<VaultAssetAttachmentDownloadResponse> {
    return api.get<VaultAssetAttachmentDownloadResponse>(
      `/api/v1/vaults/${vaultId}/assets/attachments/${attachmentId}/download-url`,
    )
  },

  deleteAttachment(vaultId: string, attachmentId: string): Promise<void> {
    return api.delete<void>(`/api/v1/vaults/${vaultId}/assets/attachments/${attachmentId}`)
  },
}

export type VaultPolicySchemaResponse = Omit<VaultAssetSchemaResponse, 'assetCategoriesMax'> & {
  policyCategoriesMax: number
}
export type VaultPolicyAttachment = VaultAssetAttachment
export type VaultPolicyAttachmentsResponse = VaultAssetAttachmentsResponse
export type InitVaultPolicyAttachmentUploadRequest = InitVaultAssetAttachmentUploadRequest
export type InitVaultPolicyAttachmentUploadResponse = InitVaultAssetAttachmentUploadResponse
export type CompleteVaultPolicyAttachmentUploadRequest = CompleteVaultAssetAttachmentUploadRequest
export type VaultPolicyAttachmentDownloadResponse = VaultAssetAttachmentDownloadResponse
export type UpdateVaultPolicyCategoriesRequest = UpdateVaultAssetCategoriesRequest
export type UpdateVaultPolicyCategoriesResponse = UpdateVaultAssetCategoriesResponse
export type AddVaultPolicyCustomFieldRequest = AddVaultAssetCustomFieldRequest
export type AddVaultPolicyCustomFieldResponse = AddVaultAssetCustomFieldResponse
export type CreateVaultPolicyCustomCategoryRequest = CreateVaultAssetCustomCategoryRequest
export type CreateVaultPolicyCustomCategoryResponse = CreateVaultAssetCustomCategoryResponse
export type UpdateVaultPolicyCustomCategoryRequest = UpdateVaultAssetCustomCategoryRequest
export type UpdateVaultPolicyCustomCategoryResponse = UpdateVaultAssetCustomCategoryResponse
export type UpdateVaultPolicyFieldRequest = UpdateVaultAssetFieldRequest
export type UpdateVaultPolicyFieldResponse = UpdateVaultAssetFieldResponse

export const vaultPoliciesApi = {
  getSchema(vaultId: string): Promise<VaultPolicySchemaResponse> {
    return api.get<VaultPolicySchemaResponse>(`/api/v1/vaults/${vaultId}/policies/schema`)
  },

  updateCategories(
    vaultId: string,
    data: UpdateVaultPolicyCategoriesRequest,
  ): Promise<UpdateVaultPolicyCategoriesResponse> {
    return api.put<UpdateVaultPolicyCategoriesResponse>(`/api/v1/vaults/${vaultId}/policies/categories`, data)
  },

  addCustomField(
    vaultId: string,
    data: AddVaultPolicyCustomFieldRequest,
  ): Promise<AddVaultPolicyCustomFieldResponse> {
    return api.post<AddVaultPolicyCustomFieldResponse>(`/api/v1/vaults/${vaultId}/policies/custom-fields`, data)
  },

  createCustomCategory(
    vaultId: string,
    data: CreateVaultPolicyCustomCategoryRequest,
  ): Promise<CreateVaultPolicyCustomCategoryResponse> {
    return api.post<CreateVaultPolicyCustomCategoryResponse>(
      `/api/v1/vaults/${vaultId}/policies/categories/custom`,
      data,
    )
  },

  updateCustomCategory(
    vaultId: string,
    categoryId: string,
    data: UpdateVaultPolicyCustomCategoryRequest,
  ): Promise<UpdateVaultPolicyCustomCategoryResponse> {
    return api.patch<UpdateVaultPolicyCustomCategoryResponse>(
      `/api/v1/vaults/${vaultId}/policies/categories/custom/${categoryId}`,
      data,
    )
  },

  deleteCustomCategory(
    vaultId: string,
    categoryId: string,
  ): Promise<UpdateVaultPolicyCategoriesResponse> {
    return api.delete<UpdateVaultPolicyCategoriesResponse>(
      `/api/v1/vaults/${vaultId}/policies/categories/custom/${categoryId}`,
    )
  },

  updateField(
    vaultId: string,
    fieldId: string,
    data: UpdateVaultPolicyFieldRequest,
  ): Promise<UpdateVaultPolicyFieldResponse> {
    return api.patch<UpdateVaultPolicyFieldResponse>(
      `/api/v1/vaults/${vaultId}/policies/fields/${fieldId}`,
      data,
    )
  },

  deleteCustomField(vaultId: string, fieldId: string): Promise<void> {
    return api.delete<void>(`/api/v1/vaults/${vaultId}/policies/custom-fields/${fieldId}`)
  },

  listAttachments(vaultId: string): Promise<VaultPolicyAttachmentsResponse> {
    return api.get<VaultPolicyAttachmentsResponse>(`/api/v1/vaults/${vaultId}/policies/attachments`)
  },

  initAttachmentUpload(
    vaultId: string,
    data: InitVaultPolicyAttachmentUploadRequest,
  ): Promise<InitVaultPolicyAttachmentUploadResponse> {
    return api.post<InitVaultPolicyAttachmentUploadResponse>(
      `/api/v1/vaults/${vaultId}/policies/attachments/init-upload`,
      data,
    )
  },

  completeAttachmentUpload(
    vaultId: string,
    attachmentId: string,
    data: CompleteVaultPolicyAttachmentUploadRequest,
  ): Promise<VaultPolicyAttachment> {
    return api.post<VaultPolicyAttachment>(
      `/api/v1/vaults/${vaultId}/policies/attachments/${attachmentId}/complete`,
      data,
    )
  },

  getAttachmentDownloadURL(
    vaultId: string,
    attachmentId: string,
  ): Promise<VaultPolicyAttachmentDownloadResponse> {
    return api.get<VaultPolicyAttachmentDownloadResponse>(
      `/api/v1/vaults/${vaultId}/policies/attachments/${attachmentId}/download-url`,
    )
  },

  deleteAttachment(vaultId: string, attachmentId: string): Promise<void> {
    return api.delete<void>(`/api/v1/vaults/${vaultId}/policies/attachments/${attachmentId}`)
  },
}
