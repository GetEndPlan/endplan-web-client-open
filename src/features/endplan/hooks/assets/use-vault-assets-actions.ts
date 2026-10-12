import { useCallback, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/client'
import { toast } from '@/shared/ui'
import type {
  AddVaultAssetCustomFieldRequest,
  AssetSchemaCategory,
  VaultResponse,
} from '../../api/clients/vault-api'
import {
  getCategoryRows,
  type AssetSectionPayloadV2,
  type AssetTableRow,
} from '../../model/asset-table-model'
import { withSelectedCategories, buildPayloadWithInitialRowsForAddedCategories, type AddCustomFieldInput } from './vault-assets-shared'
import { canAddAssetRowToCategory, checkAssetCategoriesAgainstPlan } from '../../model/plan-quota-guards'

type UpdateCategoriesMutation = {
  isPending: boolean
  mutateAsync: (input: { categoryTemplateIds: string[] }) => Promise<{ selectedCategoryIds: string[] }>
}

type AddCustomFieldMutation = {
  isPending: boolean
  mutateAsync: (input: AddVaultAssetCustomFieldRequest) => Promise<unknown>
}

type CreateCustomCategoryMutation = {
  isPending: boolean
  mutateAsync: (input: { name: string }) => Promise<{
    selectedCategoryIds: string[]
    category: { id: string; name: string }
  }>
}

type UpdateFieldMutation = {
  isPending: boolean
  mutateAsync: (input: { fieldId: string; data: { label: string } }) => Promise<unknown>
}

type UpdateCustomCategoryMutation = {
  isPending: boolean
  mutateAsync: (input: { categoryId: string; data: { name: string } }) => Promise<unknown>
}

type DeleteCustomFieldMutation = {
  isPending: boolean
  mutateAsync: (fieldId: string) => Promise<unknown>
}

type DeleteCustomCategoryMutation = {
  isPending: boolean
  mutateAsync: (categoryId: string) => Promise<{ selectedCategoryIds: string[] }>
}

type UseVaultAssetsActionsInput = {
  vault: VaultResponse | null
  categories: AssetSchemaCategory[]
  selectedCategoryIds: string[]
  setSelectedCategoryIds: Dispatch<SetStateAction<string[]>>
  payload: AssetSectionPayloadV2
  setPayload: Dispatch<SetStateAction<AssetSectionPayloadV2>>
  markDirty: () => void
  clearDirty: () => void
  saveAssets: (payloadOverride?: AssetSectionPayloadV2) => Promise<boolean>
  canPersistAssets: boolean
  hasInitiallyLoaded: boolean
  assetCategoriesMax: number | null
  assetRowsPerCategoryMax: number
  updateCategoriesMutation: UpdateCategoriesMutation
  addCustomFieldMutation: AddCustomFieldMutation
  createCustomCategoryMutation: CreateCustomCategoryMutation
  updateFieldMutation: UpdateFieldMutation
  updateCustomCategoryMutation: UpdateCustomCategoryMutation
  deleteCustomFieldMutation: DeleteCustomFieldMutation
  deleteCustomCategoryMutation: DeleteCustomCategoryMutation
}

type UseVaultAssetsActionsOutput = {
  getRows: (categoryTemplateId: string) => AssetTableRow[]
  setCellValue: (categoryTemplateId: string, rowId: string, fieldKey: string, value: string) => void
  addRow: (categoryTemplateId: string, fieldKeys: string[]) => string
  removeRow: (categoryTemplateId: string, rowId: string) => void
  persistSelectedCategories: (nextCategoryTemplateIds?: string[]) => Promise<boolean>
  addCustomField: (input: AddCustomFieldInput) => Promise<boolean>
  createCustomCategory: (
    name: string,
    options?: { insertPosition?: 'start' | 'end' },
  ) => Promise<boolean>
  renameField: (input: { fieldId: string; label: string }) => Promise<boolean>
  renameCustomCategory: (input: { categoryId: string; name: string }) => Promise<boolean>
  deleteCustomCategory: (categoryId: string) => Promise<boolean>
  deleteCustomField: (input: { fieldId: string; categoryTemplateId: string; fieldKey: string }) => Promise<boolean>
}

export function useVaultAssetsActions(
  input: UseVaultAssetsActionsInput,
): UseVaultAssetsActionsOutput {
  const { t } = useTranslation()
  const {
    vault,
    categories,
    selectedCategoryIds,
    setSelectedCategoryIds,
    payload,
    setPayload,
    markDirty,
    clearDirty,
    saveAssets,
    canPersistAssets,
    hasInitiallyLoaded,
    assetCategoriesMax,
    assetRowsPerCategoryMax,
    updateCategoriesMutation,
    addCustomFieldMutation,
    createCustomCategoryMutation,
    updateFieldMutation,
    updateCustomCategoryMutation,
    deleteCustomFieldMutation,
    deleteCustomCategoryMutation,
  } = input

  const setCellValue = useCallback(
    (categoryTemplateId: string, rowId: string, fieldKey: string, value: string) => {
      setPayload((current) => ({
        ...current,
        categories: current.categories.map((category) => {
          if (category.categoryTemplateId !== categoryTemplateId) {
            return category
          }
          return {
            ...category,
            rows: category.rows.map((row) => {
              if (row.id !== rowId) return row
              return {
                ...row,
                values: {
                  ...row.values,
                  [fieldKey]: value,
                },
              }
            }),
          }
        }),
      }))
      markDirty()
    },
    [markDirty, setPayload],
  )

  const addRow = useCallback((categoryTemplateId: string, fieldKeys: string[]) => {
    const currentRowCount = getCategoryRows(payload, categoryTemplateId).length
    if (
      !canAddAssetRowToCategory({
        assetRowsPerCategoryMax,
        currentRowCount,
      })
    ) {
      toast.error(
        t('vault.assets.planLimits.rowLimitReached', {
          max: assetRowsPerCategoryMax,
        }),
      )
      return ''
    }
    const newRowId = crypto.randomUUID()
    const baseValues = Object.fromEntries(fieldKeys.map((key) => [key, '']))
    const newRow: AssetTableRow = {
      id: newRowId,
      values: baseValues,
    }
    setPayload((current) => {
      const categoryName = categories.find((category) => category.id === categoryTemplateId)?.name
      const hasCategory = current.categories.some(
        (category) => category.categoryTemplateId === categoryTemplateId,
      )
      if (!hasCategory) {
        return {
          ...current,
          categories: [...current.categories, { categoryTemplateId, categoryName, rows: [newRow] }],
        }
      }
      return {
        ...current,
        categories: current.categories.map((category) => {
          if (category.categoryTemplateId !== categoryTemplateId) return category
          return {
            ...category,
            rows: [...category.rows, newRow],
          }
        }),
      }
    })
    markDirty()
    toast.success(t('vault.assets.toast.assetAdded'))
    return newRowId
  }, [assetRowsPerCategoryMax, categories, markDirty, payload, setPayload, t])

  const removeRow = useCallback((categoryTemplateId: string, rowId: string) => {
    setPayload((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.categoryTemplateId !== categoryTemplateId) return category
        return {
          ...category,
          rows: category.rows.filter((row) => row.id !== rowId),
        }
      }),
    }))
    markDirty()
  }, [markDirty, setPayload])

  const getRows = useCallback(
    (categoryTemplateId: string) => getCategoryRows(payload, categoryTemplateId),
    [payload],
  )

  const persistSelectedCategories = useCallback(async (nextCategoryTemplateIds?: string[]) => {
    if (!vault) {
      toast.error(t('vault.assets.attachments.vaultMissingError'))
      return false
    }
    if (!canPersistAssets || !hasInitiallyLoaded) {
      toast.error(t('vault.assets.hydration.notReady'))
      return false
    }
    const categoryTemplateIds = nextCategoryTemplateIds ?? selectedCategoryIds
    const previousSelectedCategoryIds = selectedCategoryIds
    const categoryLimitBlock = checkAssetCategoriesAgainstPlan({
      limits:
        assetCategoriesMax != null && assetCategoriesMax > 0
          ? { assetCategoriesMax }
          : null,
      selectedCategoryCount: categoryTemplateIds.length,
    })
    if (categoryLimitBlock) {
      toast.error(
        t('vault.assets.categories.limitReached', {
          max: categoryLimitBlock.max,
        }),
      )
      return false
    }
    const addedCategoryTemplateIds = categoryTemplateIds.filter(
      (id) => !previousSelectedCategoryIds.includes(id),
    )
    markDirty()
    try {
      const result = await updateCategoriesMutation.mutateAsync({
        categoryTemplateIds,
      })
      const nextPayloadToSave = buildPayloadWithInitialRowsForAddedCategories({
        payload,
        selectedCategoryIds: result.selectedCategoryIds,
        schemaCategories: categories,
        addedCategoryTemplateIds,
      })
      setSelectedCategoryIds(result.selectedCategoryIds)
      setPayload(nextPayloadToSave)
      const saved = await saveAssets(nextPayloadToSave)
      if (!saved) {
        try {
          const rollback = await updateCategoriesMutation.mutateAsync({
            categoryTemplateIds: previousSelectedCategoryIds,
          })
          setSelectedCategoryIds(rollback.selectedCategoryIds)
          setPayload((current) =>
            withSelectedCategories(current, rollback.selectedCategoryIds, categories),
          )
        } catch {
          toast.error(
            'Failed to save assets; category selection may be out of sync. Please refresh the page.',
          )
        }
        clearDirty()
        toast.error('Failed to save asset rows')
        return false
      }
      toast.success('Asset categories updated')
      return true
    } catch (error) {
      clearDirty()
      if (error instanceof ApiError && error.isLimitReached) {
        toast.error(error.apiMessage ?? 'Asset category limit reached for your plan.')
      } else {
        toast.error('Failed to update asset categories')
      }
      return false
    }
  }, [
    assetCategoriesMax,
    canPersistAssets,
    categories,
    clearDirty,
    hasInitiallyLoaded,
    markDirty,
    payload,
    saveAssets,
    selectedCategoryIds,
    setPayload,
    setSelectedCategoryIds,
    t,
    updateCategoriesMutation,
    vault,
  ])

  const addCustomField = useCallback(
    async (input: AddCustomFieldInput) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      try {
        await addCustomFieldMutation.mutateAsync({
          categoryTemplateId: input.categoryTemplateId,
          key: input.key,
          label: input.label,
          fieldType: input.fieldType ?? 'text',
        })
        toast.success('Custom field added')
        return true
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.apiMessage ?? 'Failed to add custom field')
        } else {
          toast.error('Failed to add custom field')
        }
        return false
      }
    },
    [addCustomFieldMutation, t, vault],
  )

  const createCustomCategory = useCallback(
    async (name: string, options?: { insertPosition?: 'start' | 'end' }) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      if (!canPersistAssets || !hasInitiallyLoaded) {
        toast.error(t('vault.assets.hydration.notReady'))
        return false
      }
      const categoryLimitBlock = checkAssetCategoriesAgainstPlan({
        limits:
          assetCategoriesMax != null && assetCategoriesMax > 0
            ? { assetCategoriesMax }
            : null,
        selectedCategoryCount: selectedCategoryIds.length + 1,
      })
      if (categoryLimitBlock) {
        toast.error(
          t('vault.assets.categories.limitReached', {
            max: categoryLimitBlock.max,
          }),
        )
        return false
      }
      markDirty()
      try {
        const result = await createCustomCategoryMutation.mutateAsync({
          name,
        })
        let nextSelectedCategoryIds = result.selectedCategoryIds
        if (options?.insertPosition === 'start') {
          const newId = result.category.id
          nextSelectedCategoryIds = [
            newId,
            ...result.selectedCategoryIds.filter((id) => id !== newId),
          ]
          const reorder = await updateCategoriesMutation.mutateAsync({
            categoryTemplateIds: nextSelectedCategoryIds,
          })
          nextSelectedCategoryIds = reorder.selectedCategoryIds
        }
        const nextPayloadToSave = buildPayloadWithInitialRowsForAddedCategories({
          payload,
          selectedCategoryIds: nextSelectedCategoryIds,
          schemaCategories: categories,
          addedCategoryTemplateIds: [result.category.id],
        })
        setSelectedCategoryIds(nextSelectedCategoryIds)
        setPayload(nextPayloadToSave)
        const saved = await saveAssets(nextPayloadToSave)
        if (!saved) {
          clearDirty()
          toast.error('Failed to save asset rows')
          return false
        }
        toast.success('Custom category created')
        return true
      } catch (error) {
        clearDirty()
        if (error instanceof ApiError) {
          toast.error(error.apiMessage ?? 'Failed to create category')
        } else {
          toast.error('Failed to create category')
        }
        return false
      }
    },
    [
      assetCategoriesMax,
      canPersistAssets,
      categories,
      clearDirty,
      createCustomCategoryMutation,
      hasInitiallyLoaded,
      markDirty,
      payload,
      saveAssets,
      selectedCategoryIds,
      setPayload,
      setSelectedCategoryIds,
      t,
      updateCategoriesMutation,
      vault,
    ],
  )

  const renameField = useCallback(
    async (input: { fieldId: string; label: string }) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      try {
        await updateFieldMutation.mutateAsync({
          fieldId: input.fieldId,
          data: { label: input.label },
        })
        toast.success('Column name updated')
        return true
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.apiMessage ?? 'Failed to update column name')
        } else {
          toast.error('Failed to update column name')
        }
        return false
      }
    },
    [t, updateFieldMutation, vault],
  )

  const renameCustomCategory = useCallback(
    async (input: { categoryId: string; name: string }) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      const name = input.name.trim()
      if (!name) return false
      const schemaCategory = categories.find((category) => category.id === input.categoryId)
      if (schemaCategory?.source !== 'custom') {
        toast.error(t('vault.assets.renameCategory.error'))
        return false
      }
      try {
        await updateCustomCategoryMutation.mutateAsync({
          categoryId: input.categoryId,
          data: { name },
        })
        setPayload((current) => ({
          ...current,
          categories: current.categories.map((category) =>
            category.categoryTemplateId === input.categoryId
              ? { ...category, categoryName: name }
              : category,
          ),
        }))
        markDirty()
        toast.success(t('vault.assets.renameCategory.success'))
        return true
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.apiMessage ?? t('vault.assets.renameCategory.error'))
        } else {
          toast.error(t('vault.assets.renameCategory.error'))
        }
        return false
      }
    },
    [categories, markDirty, setPayload, t, updateCustomCategoryMutation, vault],
  )

  const deleteCustomField = useCallback(
    async (input: { fieldId: string; categoryTemplateId: string; fieldKey: string }) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      try {
        await deleteCustomFieldMutation.mutateAsync(input.fieldId)
        setPayload((current) => ({
          ...current,
          categories: current.categories.map((category) => {
            if (category.categoryTemplateId !== input.categoryTemplateId) return category
            return {
              ...category,
              rows: category.rows.map((row) => {
                const nextValues = { ...row.values }
                delete nextValues[input.fieldKey]
                return { ...row, values: nextValues }
              }),
            }
          }),
        }))
        markDirty()
        toast.success('Custom field deleted')
        return true
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.apiMessage ?? 'Failed to delete custom field')
        } else {
          toast.error('Failed to delete custom field')
        }
        return false
      }
    },
    [deleteCustomFieldMutation, markDirty, setPayload, t, vault],
  )

  const deleteCustomCategory = useCallback(
    async (categoryId: string) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      if (!canPersistAssets || !hasInitiallyLoaded) {
        toast.error(t('vault.assets.hydration.notReady'))
        return false
      }
      markDirty()
      try {
        const result = await deleteCustomCategoryMutation.mutateAsync(categoryId)
        const nextPayloadToSave = withSelectedCategories(
          payload,
          result.selectedCategoryIds,
          categories,
        )
        setSelectedCategoryIds(result.selectedCategoryIds)
        setPayload(nextPayloadToSave)
        const saved = await saveAssets(nextPayloadToSave)
        if (!saved) {
          clearDirty()
          toast.error('Failed to save asset rows')
          return false
        }
        toast.success(t('vault.assets.removeCategoryDialog.deletedToast'))
        return true
      } catch (error) {
        clearDirty()
        if (error instanceof ApiError) {
          toast.error(error.apiMessage ?? t('vault.assets.removeCategoryDialog.deleteError'))
        } else {
          toast.error(t('vault.assets.removeCategoryDialog.deleteError'))
        }
        return false
      }
    },
    [
      canPersistAssets,
      categories,
      clearDirty,
      deleteCustomCategoryMutation,
      hasInitiallyLoaded,
      markDirty,
      payload,
      saveAssets,
      setPayload,
      setSelectedCategoryIds,
      t,
      vault,
    ],
  )

  return {
    getRows,
    setCellValue,
    addRow,
    removeRow,
    persistSelectedCategories,
    addCustomField,
    createCustomCategory,
    renameField,
    renameCustomCategory,
    deleteCustomCategory,
    deleteCustomField,
  }
}
