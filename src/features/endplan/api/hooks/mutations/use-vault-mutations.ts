import { useMutation, useQueryClient } from '@tanstack/react-query'
import { vaultApi, vaultAssetsApi, vaultPoliciesApi, vaultContactsApi, vaultDocumentsApi, vaultInstructionsApi, vaultSectionApi } from '../../clients/vault-api'
import type {
  CreateVaultRequest,
  UpdateVaultRequest,
  CreateVaultSectionRequest,
  VaultSectionListResponse,
  VaultSectionResponse,
  UpdateVaultSectionRequest,
  AddVaultAssetCustomFieldRequest,
  AddVaultAssetCustomFieldResponse,
  CreateVaultAssetCustomCategoryRequest,
  CreateVaultAssetCustomCategoryResponse,
  UpdateVaultAssetCustomCategoryRequest,
  UpdateVaultAssetCustomCategoryResponse,
  AssetSchemaCategory,
  AssetSchemaField,
  UpdateVaultAssetFieldRequest,
  UpdateVaultAssetFieldResponse,
  UpdateVaultAssetCategoriesRequest,
  UpdateVaultAssetCategoriesResponse,
  VaultAssetSchemaResponse,
  CreateVaultDocumentFolderRequest,
  UpdateVaultDocumentFolderRequest,
  UpdateVaultDocumentFileRequest,
  InitVaultDocumentUploadRequest,
  CompleteVaultDocumentUploadRequest,
  InitVaultAssetAttachmentUploadRequest,
  CompleteVaultAssetAttachmentUploadRequest,
  UpdateVaultPolicyCategoriesRequest,
  UpdateVaultPolicyCategoriesResponse,
  VaultPolicySchemaResponse,
  AddVaultPolicyCustomFieldRequest,
  AddVaultPolicyCustomFieldResponse,
  CreateVaultPolicyCustomCategoryRequest,
  CreateVaultPolicyCustomCategoryResponse,
  UpdateVaultPolicyCustomCategoryRequest,
  UpdateVaultPolicyCustomCategoryResponse,
  UpdateVaultPolicyFieldRequest,
  UpdateVaultPolicyFieldResponse,
  InitVaultPolicyAttachmentUploadRequest,
  CompleteVaultPolicyAttachmentUploadRequest,
} from '../../clients/vault-api'
import { vaultKeys } from '../../keys/vault-query-keys'

export function useCreateVault() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVaultRequest) => vaultApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useUpdateVault(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateVaultRequest) => vaultApi.update(vaultId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVault() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vaultApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useCreateVaultSection(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVaultSectionRequest) => vaultSectionApi.create(vaultId, data),
    retry: false,
    networkMode: 'online',
    onSuccess: (createdSection: VaultSectionResponse) => {
      queryClient.setQueryData<VaultSectionListResponse | undefined>(
        vaultKeys.sections(vaultId),
        (current) => {
          if (!current) {
            return { sections: [createdSection] }
          }
          const exists = current.sections.some((section) => section.id === createdSection.id)
          return {
            ...current,
            sections: exists
              ? current.sections.map((section) =>
                  section.id === createdSection.id ? createdSection : section,
                )
              : [...current.sections, createdSection],
          }
        },
      )
      queryClient.setQueryData<VaultSectionResponse | undefined>(
        vaultKeys.sectionById(vaultId, createdSection.id),
        createdSection,
      )
    },
  })
}

type UseUpdateVaultSectionOptions = {
  invalidateQueries?: boolean
}

export function useUpdateVaultSection(
  vaultId: string,
  sectionId: string,
  options?: UseUpdateVaultSectionOptions,
) {
  const queryClient = useQueryClient()
  const shouldInvalidate = options?.invalidateQueries ?? true
  return useMutation({
    mutationFn: (data: UpdateVaultSectionRequest) =>
      vaultSectionApi.update(vaultId, sectionId, data),
    retry: false,
    networkMode: 'online',
    onSuccess: (updatedSection: VaultSectionResponse) => {
      queryClient.setQueryData<VaultSectionListResponse | undefined>(
        vaultKeys.sections(vaultId),
        (current) => {
          if (!current) return current
          const exists = current.sections.some((section) => section.id === updatedSection.id)
          return {
            ...current,
            sections: exists
              ? current.sections.map((section) =>
                  section.id === updatedSection.id ? updatedSection : section,
                )
              : [...current.sections, updatedSection],
          }
        },
      )
      queryClient.setQueryData<VaultSectionResponse | undefined>(
        vaultKeys.sectionById(vaultId, sectionId),
        updatedSection,
      )

      if (!shouldInvalidate) {
        return
      }

      queryClient.invalidateQueries({ queryKey: vaultKeys.sections(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.sectionById(vaultId, sectionId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVaultSection(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sectionId: string) => vaultSectionApi.delete(vaultId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.sections(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useUpsertVaultInstructions(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateVaultSectionRequest) => vaultInstructionsApi.upsert(vaultId, data),
    retry: false,
    onSuccess: (section: VaultSectionResponse) => {
      queryClient.setQueryData(vaultKeys.instructions(vaultId), section)
      queryClient.invalidateQueries({ queryKey: vaultKeys.sections(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVaultInstructions(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => vaultInstructionsApi.delete(vaultId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: vaultKeys.instructions(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.sections(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useUpsertVaultContacts(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateVaultSectionRequest) => vaultContactsApi.upsert(vaultId, data),
    retry: false,
    onSuccess: (section: VaultSectionResponse) => {
      queryClient.setQueryData(vaultKeys.contacts(vaultId), section)
      queryClient.invalidateQueries({ queryKey: vaultKeys.sections(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVaultContacts(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => vaultContactsApi.delete(vaultId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: vaultKeys.contacts(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.sections(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useUpdateVaultAssetCategories(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateVaultAssetCategoriesRequest) =>
      vaultAssetsApi.updateCategories(vaultId, data),
    onSuccess: (data: UpdateVaultAssetCategoriesResponse) => {
      queryClient.setQueryData<VaultAssetSchemaResponse | undefined>(
        vaultKeys.assetsSchema(vaultId),
        (current) => {
          if (!current) return current
          const selected = new Set(data.selectedCategoryIds)
          return {
            ...current,
            selectedCategoryIds: data.selectedCategoryIds,
            categories: current.categories.map((category) => ({
              ...category,
              isSelected: selected.has(category.id),
            })),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.assetsSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useAddVaultAssetCustomField(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddVaultAssetCustomFieldRequest) => vaultAssetsApi.addCustomField(vaultId, data),
    onSuccess: (field: AddVaultAssetCustomFieldResponse) => {
      queryClient.setQueryData<VaultAssetSchemaResponse | undefined>(
        vaultKeys.assetsSchema(vaultId),
        (current) => {
          if (!current) return current

          const toField = (value: AddVaultAssetCustomFieldResponse): AssetSchemaField => ({
            id: value.id,
            key: value.key,
            label: value.label,
            fieldType: value.fieldType,
            required: value.required,
            displayOrder: value.displayOrder,
            source: 'custom',
            options: value.options ?? [],
          })

          const categoryIndex = current.categories.findIndex(
            (category) => category.id === field.categoryTemplateId,
          )
          if (categoryIndex < 0) return current

          const updatedCategories = [...current.categories]
          const target = updatedCategories[categoryIndex]
          const targetFields = target.fields ?? []
          const existing = targetFields.find((entry) => entry.id === field.id)
          const mergedFields = existing
            ? targetFields.map((entry) => (entry.id === field.id ? toField(field) : entry))
            : [...targetFields, toField(field)]

          const sortedFields = [...mergedFields].sort((a, b) => {
            if (a.displayOrder === b.displayOrder) return a.label.localeCompare(b.label)
            return a.displayOrder - b.displayOrder
          })

          updatedCategories[categoryIndex] = {
            ...target,
            isSelected: true,
            fields: sortedFields,
          } satisfies AssetSchemaCategory

          const selectedCategoryIDs = current.selectedCategoryIds.includes(field.categoryTemplateId)
            ? current.selectedCategoryIds
            : [...current.selectedCategoryIds, field.categoryTemplateId]

          return {
            ...current,
            categories: updatedCategories,
            selectedCategoryIds: selectedCategoryIDs,
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.assetsSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVaultAssetCustomField(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fieldID: string) => vaultAssetsApi.deleteCustomField(vaultId, fieldID),
    onSuccess: (_, fieldID) => {
      queryClient.setQueryData<VaultAssetSchemaResponse | undefined>(
        vaultKeys.assetsSchema(vaultId),
        (current) => {
          if (!current) return current
          return {
            ...current,
            categories: current.categories.map((category) => ({
              ...category,
              fields: (category.fields ?? []).filter((field) => field.id !== fieldID),
            })),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.assetsSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useInitVaultAssetAttachmentUpload(vaultId: string) {
  return useMutation({
    mutationFn: (data: InitVaultAssetAttachmentUploadRequest) =>
      vaultAssetsApi.initAttachmentUpload(vaultId, data),
  })
}

export function useCompleteVaultAssetAttachmentUpload(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { attachmentId: string; data: CompleteVaultAssetAttachmentUploadRequest }) =>
      vaultAssetsApi.completeAttachmentUpload(vaultId, input.attachmentId, input.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.assetsAttachments(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVaultAssetAttachment(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => vaultAssetsApi.deleteAttachment(vaultId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.assetsAttachments(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useCreateVaultAssetCustomCategory(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVaultAssetCustomCategoryRequest) =>
      vaultAssetsApi.createCustomCategory(vaultId, data),
    onSuccess: (data: CreateVaultAssetCustomCategoryResponse) => {
      queryClient.setQueryData<VaultAssetSchemaResponse | undefined>(
        vaultKeys.assetsSchema(vaultId),
        (current) => {
          if (!current) return current

          const selected = new Set(data.selectedCategoryIds)
          const exists = current.categories.some((category) => category.id === data.category.id)
          const categories = exists
            ? current.categories.map((category) =>
                category.id === data.category.id ? { ...data.category, isSelected: true } : category,
              )
            : [...current.categories, { ...data.category, isSelected: true }]

          const sortedCategories = [...categories].sort((a, b) => {
            if (a.displayOrder === b.displayOrder) return a.name.localeCompare(b.name)
            return a.displayOrder - b.displayOrder
          })

          return {
            ...current,
            selectedCategoryIds: data.selectedCategoryIds,
            categories: sortedCategories.map((category) => ({
              ...category,
              isSelected: selected.has(category.id),
            })),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.assetsSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useUpdateVaultAssetCustomCategory(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { categoryId: string; data: UpdateVaultAssetCustomCategoryRequest }) =>
      vaultAssetsApi.updateCustomCategory(vaultId, input.categoryId, input.data),
    onSuccess: (category: UpdateVaultAssetCustomCategoryResponse) => {
      queryClient.setQueryData<VaultAssetSchemaResponse | undefined>(
        vaultKeys.assetsSchema(vaultId),
        (current) => {
          if (!current) return current
          return {
            ...current,
            categories: current.categories.map((entry) =>
              entry.id === category.id ? { ...entry, ...category } : entry,
            ),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.assetsSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVaultAssetCustomCategory(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: string) => vaultAssetsApi.deleteCustomCategory(vaultId, categoryId),
    onSuccess: (data: UpdateVaultAssetCategoriesResponse, categoryId) => {
      queryClient.setQueryData<VaultAssetSchemaResponse | undefined>(
        vaultKeys.assetsSchema(vaultId),
        (current) => {
          if (!current) return current
          const selected = new Set(data.selectedCategoryIds)
          return {
            ...current,
            selectedCategoryIds: data.selectedCategoryIds,
            categories: current.categories
              .filter((category) => category.id !== categoryId)
              .map((category) => ({
                ...category,
                isSelected: selected.has(category.id),
              })),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.assetsSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useUpdateVaultAssetField(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { fieldId: string; data: UpdateVaultAssetFieldRequest }) =>
      vaultAssetsApi.updateField(vaultId, input.fieldId, input.data),
    onSuccess: (field: UpdateVaultAssetFieldResponse) => {
      queryClient.setQueryData<VaultAssetSchemaResponse | undefined>(
        vaultKeys.assetsSchema(vaultId),
        (current) => {
          if (!current) return current

          const toField = (value: UpdateVaultAssetFieldResponse): AssetSchemaField => ({
            id: value.id,
            key: value.key,
            label: value.label,
            fieldType: value.fieldType,
            required: value.required,
            displayOrder: value.displayOrder,
            source: 'custom',
            options: value.options ?? [],
          })

          return {
            ...current,
            categories: current.categories.map((category) => {
              if (category.id !== field.categoryTemplateId) return category

              const currentFields = category.fields ?? []
              const existingIndex = currentFields.findIndex(
                (entry) => entry.id === field.id || entry.key === field.key,
              )
              const nextFields =
                existingIndex >= 0
                  ? currentFields.map((entry, idx) => (idx === existingIndex ? toField(field) : entry))
                  : [...currentFields, toField(field)]

              const sortedFields = [...nextFields].sort((a, b) => {
                if (a.displayOrder === b.displayOrder) return a.label.localeCompare(b.label)
                return a.displayOrder - b.displayOrder
              })

              return {
                ...category,
                fields: sortedFields,
              }
            }),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.assetsSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useUpdateVaultPolicyCategories(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateVaultPolicyCategoriesRequest) =>
      vaultPoliciesApi.updateCategories(vaultId, data),
    onSuccess: (data: UpdateVaultPolicyCategoriesResponse) => {
      queryClient.setQueryData<VaultPolicySchemaResponse | undefined>(
        vaultKeys.policiesSchema(vaultId),
        (current) => {
          if (!current) return current
          const selected = new Set(data.selectedCategoryIds)
          return {
            ...current,
            selectedCategoryIds: data.selectedCategoryIds,
            categories: current.categories.map((category) => ({
              ...category,
              isSelected: selected.has(category.id),
            })),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.policiesSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useAddVaultPolicyCustomField(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddVaultPolicyCustomFieldRequest) => vaultPoliciesApi.addCustomField(vaultId, data),
    onSuccess: (field: AddVaultPolicyCustomFieldResponse) => {
      queryClient.setQueryData<VaultPolicySchemaResponse | undefined>(
        vaultKeys.policiesSchema(vaultId),
        (current) => {
          if (!current) return current

          const toField = (value: AddVaultPolicyCustomFieldResponse): AssetSchemaField => ({
            id: value.id,
            key: value.key,
            label: value.label,
            fieldType: value.fieldType,
            required: value.required,
            displayOrder: value.displayOrder,
            source: 'custom',
            options: value.options ?? [],
          })

          const categoryIndex = current.categories.findIndex(
            (category) => category.id === field.categoryTemplateId,
          )
          if (categoryIndex < 0) return current

          const updatedCategories = [...current.categories]
          const target = updatedCategories[categoryIndex]
          const targetFields = target.fields ?? []
          const existing = targetFields.find((entry) => entry.id === field.id)
          const mergedFields = existing
            ? targetFields.map((entry) => (entry.id === field.id ? toField(field) : entry))
            : [...targetFields, toField(field)]

          const sortedFields = [...mergedFields].sort((a, b) => {
            if (a.displayOrder === b.displayOrder) return a.label.localeCompare(b.label)
            return a.displayOrder - b.displayOrder
          })

          updatedCategories[categoryIndex] = {
            ...target,
            isSelected: true,
            fields: sortedFields,
          } satisfies AssetSchemaCategory

          const selectedCategoryIDs = current.selectedCategoryIds.includes(field.categoryTemplateId)
            ? current.selectedCategoryIds
            : [...current.selectedCategoryIds, field.categoryTemplateId]

          return {
            ...current,
            categories: updatedCategories,
            selectedCategoryIds: selectedCategoryIDs,
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.policiesSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVaultPolicyCustomField(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fieldID: string) => vaultPoliciesApi.deleteCustomField(vaultId, fieldID),
    onSuccess: (_, fieldID) => {
      queryClient.setQueryData<VaultPolicySchemaResponse | undefined>(
        vaultKeys.policiesSchema(vaultId),
        (current) => {
          if (!current) return current
          return {
            ...current,
            categories: current.categories.map((category) => ({
              ...category,
              fields: (category.fields ?? []).filter((field) => field.id !== fieldID),
            })),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.policiesSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useInitVaultPolicyAttachmentUpload(vaultId: string) {
  return useMutation({
    mutationFn: (data: InitVaultPolicyAttachmentUploadRequest) =>
      vaultPoliciesApi.initAttachmentUpload(vaultId, data),
  })
}

export function useCompleteVaultPolicyAttachmentUpload(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { attachmentId: string; data: CompleteVaultPolicyAttachmentUploadRequest }) =>
      vaultPoliciesApi.completeAttachmentUpload(vaultId, input.attachmentId, input.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.policiesAttachments(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVaultPolicyAttachment(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => vaultPoliciesApi.deleteAttachment(vaultId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.policiesAttachments(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useCreateVaultPolicyCustomCategory(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVaultPolicyCustomCategoryRequest) =>
      vaultPoliciesApi.createCustomCategory(vaultId, data),
    onSuccess: (data: CreateVaultPolicyCustomCategoryResponse) => {
      queryClient.setQueryData<VaultPolicySchemaResponse | undefined>(
        vaultKeys.policiesSchema(vaultId),
        (current) => {
          if (!current) return current

          const selected = new Set(data.selectedCategoryIds)
          const exists = current.categories.some((category) => category.id === data.category.id)
          const categories = exists
            ? current.categories.map((category) =>
                category.id === data.category.id ? { ...data.category, isSelected: true } : category,
              )
            : [...current.categories, { ...data.category, isSelected: true }]

          const sortedCategories = [...categories].sort((a, b) => {
            if (a.displayOrder === b.displayOrder) return a.name.localeCompare(b.name)
            return a.displayOrder - b.displayOrder
          })

          return {
            ...current,
            selectedCategoryIds: data.selectedCategoryIds,
            categories: sortedCategories.map((category) => ({
              ...category,
              isSelected: selected.has(category.id),
            })),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.policiesSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useUpdateVaultPolicyCustomCategory(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { categoryId: string; data: UpdateVaultPolicyCustomCategoryRequest }) =>
      vaultPoliciesApi.updateCustomCategory(vaultId, input.categoryId, input.data),
    onSuccess: (category: UpdateVaultPolicyCustomCategoryResponse) => {
      queryClient.setQueryData<VaultPolicySchemaResponse | undefined>(
        vaultKeys.policiesSchema(vaultId),
        (current) => {
          if (!current) return current
          return {
            ...current,
            categories: current.categories.map((entry) =>
              entry.id === category.id ? { ...entry, ...category } : entry,
            ),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.policiesSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useDeleteVaultPolicyCustomCategory(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: string) => vaultPoliciesApi.deleteCustomCategory(vaultId, categoryId),
    onSuccess: (data: UpdateVaultPolicyCategoriesResponse, categoryId) => {
      queryClient.setQueryData<VaultPolicySchemaResponse | undefined>(
        vaultKeys.policiesSchema(vaultId),
        (current) => {
          if (!current) return current
          const selected = new Set(data.selectedCategoryIds)
          return {
            ...current,
            selectedCategoryIds: data.selectedCategoryIds,
            categories: current.categories
              .filter((category) => category.id !== categoryId)
              .map((category) => ({
                ...category,
                isSelected: selected.has(category.id),
              })),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.policiesSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useUpdateVaultPolicyField(vaultId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { fieldId: string; data: UpdateVaultPolicyFieldRequest }) =>
      vaultPoliciesApi.updateField(vaultId, input.fieldId, input.data),
    onSuccess: (field: UpdateVaultPolicyFieldResponse) => {
      queryClient.setQueryData<VaultPolicySchemaResponse | undefined>(
        vaultKeys.policiesSchema(vaultId),
        (current) => {
          if (!current) return current

          const toField = (value: UpdateVaultPolicyFieldResponse): AssetSchemaField => ({
            id: value.id,
            key: value.key,
            label: value.label,
            fieldType: value.fieldType,
            required: value.required,
            displayOrder: value.displayOrder,
            source: 'custom',
            options: value.options ?? [],
          })

          return {
            ...current,
            categories: current.categories.map((category) => {
              if (category.id !== field.categoryTemplateId) return category

              const currentFields = category.fields ?? []
              const existingIndex = currentFields.findIndex(
                (entry) => entry.id === field.id || entry.key === field.key,
              )
              const nextFields =
                existingIndex >= 0
                  ? currentFields.map((entry, idx) => (idx === existingIndex ? toField(field) : entry))
                  : [...currentFields, toField(field)]

              const sortedFields = [...nextFields].sort((a, b) => {
                if (a.displayOrder === b.displayOrder) return a.label.localeCompare(b.label)
                return a.displayOrder - b.displayOrder
              })

              return {
                ...category,
                fields: sortedFields,
              }
            }),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: vaultKeys.policiesSchema(vaultId) })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

type UseVaultDocumentsMutationOptions = {
  invalidateQueries?: boolean
}

export function useCreateVaultDocumentFolder(
  vaultId: string,
  options?: UseVaultDocumentsMutationOptions,
) {
  const queryClient = useQueryClient()
  const shouldInvalidate = options?.invalidateQueries ?? true
  return useMutation({
    mutationFn: (data: CreateVaultDocumentFolderRequest) =>
      vaultDocumentsApi.createFolder(vaultId, data),
    onSuccess: () => {
      if (!shouldInvalidate) return
      queryClient.invalidateQueries({ queryKey: vaultKeys.documentsTree(vaultId) })
    },
  })
}

export function useUpdateVaultDocumentFolder(
  vaultId: string,
  options?: UseVaultDocumentsMutationOptions,
) {
  const queryClient = useQueryClient()
  const shouldInvalidate = options?.invalidateQueries ?? true
  return useMutation({
    mutationFn: (input: { folderId: string; data: UpdateVaultDocumentFolderRequest }) =>
      vaultDocumentsApi.updateFolder(vaultId, input.folderId, input.data),
    onSuccess: () => {
      if (!shouldInvalidate) return
      queryClient.invalidateQueries({ queryKey: vaultKeys.documentsTree(vaultId) })
    },
  })
}

export function useDeleteVaultDocumentFolder(
  vaultId: string,
  options?: UseVaultDocumentsMutationOptions,
) {
  const queryClient = useQueryClient()
  const shouldInvalidate = options?.invalidateQueries ?? true
  return useMutation({
    mutationFn: (folderId: string) => vaultDocumentsApi.deleteFolder(vaultId, folderId),
    onSuccess: () => {
      if (!shouldInvalidate) return
      queryClient.invalidateQueries({ queryKey: vaultKeys.documentsTree(vaultId) })
    },
  })
}

export function useInitVaultDocumentUpload(vaultId: string) {
  return useMutation({
    mutationFn: (data: InitVaultDocumentUploadRequest) => vaultDocumentsApi.initUpload(vaultId, data),
  })
}

export function useUpdateVaultDocumentFile(
  vaultId: string,
  options?: UseVaultDocumentsMutationOptions,
) {
  const queryClient = useQueryClient()
  const shouldInvalidate = options?.invalidateQueries ?? true
  return useMutation({
    mutationFn: (input: { fileId: string; data: UpdateVaultDocumentFileRequest }) =>
      vaultDocumentsApi.updateFile(vaultId, input.fileId, input.data),
    onSuccess: () => {
      if (!shouldInvalidate) return
      queryClient.invalidateQueries({ queryKey: vaultKeys.documentsTree(vaultId) })
    },
  })
}

export function useCompleteVaultDocumentUpload(
  vaultId: string,
  options?: UseVaultDocumentsMutationOptions,
) {
  const queryClient = useQueryClient()
  const shouldInvalidate = options?.invalidateQueries ?? true
  return useMutation({
    mutationFn: (input: { fileId: string; data: CompleteVaultDocumentUploadRequest }) =>
      vaultDocumentsApi.completeUpload(vaultId, input.fileId, input.data),
    onSuccess: () => {
      if (!shouldInvalidate) return
      queryClient.invalidateQueries({ queryKey: vaultKeys.documentsTree(vaultId) })
    },
  })
}

export function useDeleteVaultDocumentFile(
  vaultId: string,
  options?: UseVaultDocumentsMutationOptions,
) {
  const queryClient = useQueryClient()
  const shouldInvalidate = options?.invalidateQueries ?? true
  return useMutation({
    mutationFn: (fileId: string) => vaultDocumentsApi.deleteFile(vaultId, fileId),
    onSuccess: () => {
      if (!shouldInvalidate) return
      queryClient.invalidateQueries({ queryKey: vaultKeys.documentsTree(vaultId) })
    },
  })
}
