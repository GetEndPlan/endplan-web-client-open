import { type ComponentType, type FocusEvent, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlignLeft,
  Banknote,
  Briefcase,
  CalendarDays,
  Eye,
  EyeOff,
  FileText,
  Hash,
  KeyRound,
  List,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Type,
  User,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { endplanSectionPath } from '@/app/constants/routes'
import { cn } from '@/shared/lib/cn'
import { Button, Card, ModalOverlay, PageHeader } from '@/shared/ui'
import { parseAssetAttachmentCellValue } from '../../model/asset-attachment-ref'
import {
  parseAssetContactCellValue,
  resolveAssetContactCellLabel,
} from '../../model/asset-contact-ref'
import { SECTION_ID } from '../../model/vault-section-types'
import { AssetAttachmentDrawer } from '../attachments/asset-attachment-drawer'
import { AssetAttachmentModal } from '../attachments/asset-attachment-modal'
import { AssetContactCell } from '../attachments/asset-contact-cell'
import { AssetContactPickerModal } from '../attachments/asset-contact-picker-modal'
import { PolicyWrappingTextCell } from './policy-wrapping-text-cell'
import {
  VaultCategoryQuotaLimitModal,
  type VaultPlanQuotaLimitKind,
} from '../section/vault-category-quota-limit-modal'
import { VaultPoliciesDeleteColumnDialog } from './vault-policies-delete-column-dialog'
import { VaultPoliciesDuplicateColumnDialog } from './vault-policies-duplicate-column-dialog'
import { VaultPoliciesDeleteRowDialog } from './vault-policies-delete-row-dialog'
import { VaultPoliciesSuggestionsPanel } from './vault-policies-suggestions-panel'
import { VaultPoliciesRemoveCategoryDialog } from './vault-policies-remove-category-dialog'
import { AssetAttachmentCell } from '../attachments/asset-attachment-cell'
import { VaultDocumentViewerModal } from '../documents/vault-document-viewer-modal'
import {
  ASSETS_FLOAT_ACTIONS_TD,
  ASSETS_FLOAT_ACTIONS_TH,
  assetsTableBodyDataCellClass,
  assetsTableDeleteActionClassName,
  assetsTableHeaderCellClass,
  makeUniqueVaultAssetFieldKey,
  mapAttachmentOrLinkedDocToDrawerModel,
  normalizeVaultAssetFieldKey,
  openVaultPolicyAttachmentView,
  finalizeMoneyValue,
  resolveAssetFieldHeadingLabel,
  sanitizeMoneyInput,
  sortVaultCategoryFields,
} from './vault-policies-table-helpers'
import {
  defaultVaultPoliciesCustomFieldDraft,
  type VaultPoliciesCustomFieldDraft,
  type VaultPoliciesTableProps,
} from './vault-policies-table.types'
import { canAddAssetRowToCategory } from '../../model/plan-quota-guards'
import { nextOtherCategoryName } from '../../model/other-category-name'

export function VaultPoliciesTable(props: VaultPoliciesTableProps) {
  const {
    categories,
    selectedCategoryIds,
    canPersistAssets,
    policyCategoriesMax,
    assetRowsPerCategoryMax,
    isSavingCategories,
    isAddingCustomField,
    isDeletingCustomField,
    isDeletingCustomCategory,
    isCreatingCustomCategory,
    isUpdatingCustomCategory,
    isUpdatingField,
    getRows,
    setCellValue,
    onEditorActivityChange,
    addRow,
    removeRow,
    onPersistSelectedCategories,
    onCreateCustomCategory,
    onAddCustomField,
    onDeleteCustomField,
    onRenameField,
    onRenameCustomCategory,
    onDeleteCustomCategory,
    attachmentsById,
    documentsFolders,
    documentsFiles,
    documentsFilesById,
    activeAttachmentCellKey,
    onUploadAttachment,
    onDownloadAttachment,
    onDownloadLinkedDocument,
    onViewLinkedDocument,
    onViewAttachment,
    documentViewer,
    onLinkDocument,
    onClearAttachment,
    contactOptions,
    contactsById,
    onLinkContact,
    onClearContact,
    canManageDocuments,
    onCreateDocumentsFolder,
    onUploadDocumentToFolder,
    isVaultDocumentsActionBusy,
  } = props

  const { t } = useTranslation()
  const navigate = useNavigate()
  const customFieldTypeOptions = useMemo(
    () =>
      [
        { value: 'text' as const, label: t('vault.policies.fieldTypes.text'), icon: Type },
        { value: 'textarea' as const, label: t('vault.policies.fieldTypes.textarea'), icon: AlignLeft },
        { value: 'number' as const, label: t('vault.policies.fieldTypes.number'), icon: Hash },
        { value: 'value' as const, label: t('vault.policies.fieldTypes.value'), icon: Banknote },
        { value: 'date' as const, label: t('vault.policies.fieldTypes.date'), icon: CalendarDays },
        { value: 'select' as const, label: t('vault.policies.fieldTypes.select'), icon: List },
        { value: 'password' as const, label: t('vault.policies.fieldTypes.password'), icon: KeyRound },
        {
          value: 'attachment' as const,
          label: t('vault.policies.attachments.fieldTypeLabel'),
          icon: FileText,
        },
        {
          value: 'contact' as const,
          label: t('vault.policies.contacts.fieldTypeLabel'),
          icon: User,
        },
      ] satisfies Array<{
        value: VaultPoliciesCustomFieldDraft['fieldType']
        label: string
        icon: ComponentType<{ className?: string }>
      }>,
    [t],
  )
  const [customFieldDrafts, setCustomFieldDrafts] = useState<Record<string, VaultPoliciesCustomFieldDraft>>({})
  const [activeCustomFieldCategoryID, setActiveCustomFieldCategoryID] = useState<string | null>(null)
  const [addFieldPopoverPosition, setAddFieldPopoverPosition] = useState<{
    top: number
    left: number
    width: number
    placement: 'top' | 'bottom'
  } | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [addCategoryInsertPosition, setAddCategoryInsertPosition] = useState<'start' | 'end'>(
    'end',
  )
  const [quotaLimitModalKind, setQuotaLimitModalKind] = useState<VaultPlanQuotaLimitKind | null>(
    null,
  )
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryPendingRemoval, setCategoryPendingRemoval] = useState<{
    id: string
    name: string
  } | null>(null)
  const [columnPendingDeletion, setColumnPendingDeletion] = useState<{
    fieldId: string
    categoryTemplateId: string
    fieldKey: string
    fieldLabel: string
    categoryName: string
  } | null>(null)
  const [rowPendingDeletion, setRowPendingDeletion] = useState<{
    categoryTemplateId: string
    rowId: string
    categoryName: string
    rowNumber: number
  } | null>(null)
  const [editingFieldID, setEditingFieldID] = useState<string | null>(null)
  const [editingFieldLabel, setEditingFieldLabel] = useState('')
  const [editingCategoryID, setEditingCategoryID] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [attachmentModalCell, setAttachmentModalCell] = useState<{
    categoryId: string
    rowId: string
    fieldKey: string
  } | null>(null)
  const [attachmentDrawerCell, setAttachmentDrawerCell] = useState<{
    categoryId: string
    rowId: string
    fieldKey: string
  } | null>(null)
  const [contactModalCell, setContactModalCell] = useState<{
    categoryId: string
    rowId: string
    fieldKey: string
  } | null>(null)
  const [focusNewRowFirstCell, setFocusNewRowFirstCell] = useState<{
    categoryId: string
    rowId: string
  } | null>(null)
  /** Per-cell: when true, password field shows plaintext in the editor. */
  const [passwordRevealByCell, setPasswordRevealByCell] = useState<Record<string, boolean>>({})

  const canAddRowInCategory = (categoryTemplateId: string) =>
    canAddAssetRowToCategory({
      assetRowsPerCategoryMax,
      currentRowCount: getRows(categoryTemplateId).length,
    })

  const handleAddRow = (categoryTemplateId: string, fieldKeys: string[]) => {
    if (!canAddRowInCategory(categoryTemplateId)) {
      setQuotaLimitModalKind('row')
      return
    }
    const rowId = addRow(categoryTemplateId, fieldKeys)
    if (!rowId) return
    setFocusNewRowFirstCell({ categoryId: categoryTemplateId, rowId })
  }

  const [duplicateColumnPending, setDuplicateColumnPending] = useState<{
    categoryId: string
    draft: VaultPoliciesCustomFieldDraft
  } | null>(null)
  const activeAddFieldButtonRef = useRef<HTMLButtonElement | null>(null)
  const addFieldPopoverRef = useRef<HTMLDivElement | null>(null)

  const selectedCategories = useMemo(() => {
    const byId = new Map(categories.map((category) => [category.id, category]))
    return selectedCategoryIds
      .map((id) => byId.get(id))
      .filter((category): category is (typeof categories)[number] => category != null)
  }, [categories, selectedCategoryIds])
  const selectedCategoryViews = useMemo(
    () =>
      selectedCategories.map((category) => ({
        category,
        fields: sortVaultCategoryFields(category),
        rows: getRows(category.id),
      })),
    [getRows, selectedCategories],
  )
  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          (category.isActive ?? true) && !selectedCategoryIds.includes(category.id),
      ),
    [categories, selectedCategoryIds],
  )

  const normalizedCategorySearch = categorySearch.trim().toLowerCase()
  const filteredAvailableCategories = useMemo(() => {
    if (!normalizedCategorySearch) return availableCategories
    return availableCategories.filter((category) => {
      const name = category.name.toLowerCase()
      const description = category.description?.toLowerCase() ?? ''
      return name.includes(normalizedCategorySearch) || description.includes(normalizedCategorySearch)
    })
  }, [availableCategories, normalizedCategorySearch])
  const canCreateCustomCategory = normalizedCategorySearch.length > 0
  const isCategoryQuotaExhausted =
    policyCategoriesMax > 0 && selectedCategoryIds.length >= policyCategoriesMax
  const canAddMoreCategories = canPersistAssets && !isCategoryQuotaExhausted

  const showCategoryQuotaLimit = () => {
    setCategorySearch('')
    setIsCategoryModalOpen(false)
    setQuotaLimitModalKind('category')
  }

  const openAddCategoryFlow = (insertPosition: 'start' | 'end') => {
    if (!canPersistAssets) return
    if (isCategoryQuotaExhausted) {
      showCategoryQuotaLimit()
      return
    }
    setAddCategoryInsertPosition(insertPosition)
    setIsCategoryModalOpen(true)
  }
  const activeCategory = useMemo(
    () =>
      activeCustomFieldCategoryID
        ? selectedCategoryViews.find(({ category }) => category.id === activeCustomFieldCategoryID)?.category ?? null
        : null,
    [activeCustomFieldCategoryID, selectedCategoryViews],
  )
  const activeCustomDraft =
    activeCustomFieldCategoryID == null
      ? defaultVaultPoliciesCustomFieldDraft
      : (customFieldDrafts[activeCustomFieldCategoryID] ?? defaultVaultPoliciesCustomFieldDraft)
  const activeAttachmentModal = useMemo(() => {
    if (!attachmentModalCell) return null

    const categoryView = selectedCategoryViews.find(
      ({ category }) => category.id === attachmentModalCell.categoryId,
    )
    if (!categoryView) return null

    const field = categoryView.fields.find((entry) => entry.key === attachmentModalCell.fieldKey)
    const row = categoryView.rows.find((entry) => entry.id === attachmentModalCell.rowId)
    if (!field || !row) return null

    const value = row.values[field.key] ?? ''
    const cellKey = `${categoryView.category.id}:${row.id}:${field.key}`
    const parsed = parseAssetAttachmentCellValue(value)
    const assetAttachment =
      parsed.kind === 'asset_attachment' ? attachmentsById[parsed.attachmentId] ?? null : null
    const linkedDocument =
      parsed.kind === 'document_link'
        ? documentsFilesById[parsed.reference.fileId] ?? null
        : null
    const currentLabel =
      assetAttachment?.name ??
      linkedDocument?.name ??
      (parsed.kind === 'document_link' ? parsed.reference.fileName : null) ??
      null

    return {
      categoryId: categoryView.category.id,
      rowId: row.id,
      fieldKey: field.key,
      title: field.label || 'Document',
      value,
      parsed,
      currentLabel,
      attachment: assetAttachment,
      linkedDocument,
      isBusy: activeAttachmentCellKey === cellKey,
    }
  }, [
    activeAttachmentCellKey,
    attachmentModalCell,
    attachmentsById,
    documentsFilesById,
    selectedCategoryViews,
  ])

  const activeAttachmentDrawer = useMemo(() => {
    if (!attachmentDrawerCell) return null

    const categoryView = selectedCategoryViews.find(
      ({ category }) => category.id === attachmentDrawerCell.categoryId,
    )
    if (!categoryView) return null

    const field = categoryView.fields.find((entry) => entry.key === attachmentDrawerCell.fieldKey)
    const row = categoryView.rows.find((entry) => entry.id === attachmentDrawerCell.rowId)
    if (!field || !row) return null

    const value = row.values[field.key] ?? ''
    const cellKey = `${categoryView.category.id}:${row.id}:${field.key}`
    const parsed = parseAssetAttachmentCellValue(value)
    const assetAttachment =
      parsed.kind === 'asset_attachment' ? attachmentsById[parsed.attachmentId] ?? null : null
    const linkedDocument =
      parsed.kind === 'document_link'
        ? documentsFilesById[parsed.reference.fileId] ?? null
        : null
    const currentLabel =
      assetAttachment?.name ??
      linkedDocument?.name ??
      (parsed.kind === 'document_link' ? parsed.reference.fileName : null) ??
      null

    return {
      categoryId: categoryView.category.id,
      rowId: row.id,
      fieldKey: field.key,
      title: field.label || 'Document',
      value,
      parsed,
      currentLabel,
      attachment: assetAttachment,
      linkedDocument,
      isBusy: activeAttachmentCellKey === cellKey,
    }
  }, [
    activeAttachmentCellKey,
    attachmentDrawerCell,
    attachmentsById,
    documentsFilesById,
    selectedCategoryViews,
  ])

  const defaultCustomColumnLabel = (fieldType: VaultPoliciesCustomFieldDraft['fieldType']) =>
    fieldType === 'attachment'
      ? t('vault.policies.attachments.fieldTypeLabel')
      : fieldType === 'contact'
        ? t('vault.policies.contacts.fieldTypeLabel')
      : fieldType === 'password'
        ? t('vault.policies.customColumn.passwordDefaultName')
        : fieldType === 'value'
          ? t('vault.policies.customColumn.valueDefaultName')
          : t('vault.policies.customColumn.newColumnDefaultName')

  const updateVaultPoliciesCustomFieldDraft = (categoryID: string, update: Partial<VaultPoliciesCustomFieldDraft>) => {
    setCustomFieldDrafts((current) => ({
      ...current,
      [categoryID]: {
        ...(current[categoryID] ?? defaultVaultPoliciesCustomFieldDraft),
        ...update,
      },
    }))
  }

  const resetCustomFieldDraft = (categoryID: string) => {
    setCustomFieldDrafts((current) => ({
      ...current,
      [categoryID]: defaultVaultPoliciesCustomFieldDraft,
    }))
  }

  const submitCustomField = async (
    categoryID: string,
    draft: VaultPoliciesCustomFieldDraft,
    ignoreDuplicateLabel = false,
  ) => {
    const label = defaultCustomColumnLabel(draft.fieldType)
    const baseKey = normalizeVaultAssetFieldKey(label)
    if (!baseKey) {
      return false
    }

    const category = categories.find((c) => c.id === categoryID)
    if (category && !ignoreDuplicateLabel) {
      const normalized = label.toLowerCase()
      const isDuplicate = sortVaultCategoryFields(category).some(
        (field) => field.label.trim().toLowerCase() === normalized,
      )
      if (isDuplicate) {
        setDuplicateColumnPending({ categoryId: categoryID, draft })
        return false
      }
    }

    const ok = await onAddCustomField({
      categoryTemplateId: categoryID,
      key: makeUniqueVaultAssetFieldKey(
        baseKey,
        new Set(
          (category?.fields ?? [])
            .map((field) => field.key?.trim().toLowerCase())
            .filter((value): value is string => Boolean(value)),
        ),
      ),
      label,
      fieldType: draft.fieldType,
    })

    if (ok) {
      resetCustomFieldDraft(categoryID)
      closeAddFieldPopover()
      setDuplicateColumnPending(null)
    }

    return ok
  }

  const closeAddFieldPopover = () => {
    activeAddFieldButtonRef.current = null
    setActiveCustomFieldCategoryID(null)
    setAddFieldPopoverPosition(null)
  }

  const positionAddFieldPopover = (useMeasuredHeight = false) => {
    const button = activeAddFieldButtonRef.current
    if (!button) return
    const viewportPadding = 8
    const gap = 8
    const rect = button.getBoundingClientRect()
    const width = Math.min(368, window.innerWidth - viewportPadding * 2)
    const left = Math.min(
      Math.max(viewportPadding, rect.right - width),
      Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
    )
    const measuredHeight = useMeasuredHeight ? addFieldPopoverRef.current?.offsetHeight : undefined
    const popoverHeight = Math.min(
      measuredHeight ?? 360,
      Math.max(240, window.innerHeight - viewportPadding * 2),
    )
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const placement: 'top' | 'bottom' =
      spaceBelow < Math.min(320, popoverHeight) && spaceAbove > spaceBelow ? 'top' : 'bottom'
    const rawTop = placement === 'top' ? rect.top - gap - popoverHeight : rect.bottom + gap
    const top = Math.max(
      viewportPadding,
      Math.min(rawTop, window.innerHeight - popoverHeight - viewportPadding),
    )

    setAddFieldPopoverPosition((current) => {
      if (
        current &&
        current.top === top &&
        current.left === left &&
        current.width === width &&
        current.placement === placement
      ) {
        return current
      }
      return { top, left, width, placement }
    })
  }

  const toggleAddFieldPopover = (categoryID: string, button: HTMLButtonElement) => {
    if (activeCustomFieldCategoryID === categoryID) {
      closeAddFieldPopover()
      return
    }
    activeAddFieldButtonRef.current = button
    setActiveCustomFieldCategoryID(categoryID)
    positionAddFieldPopover()
  }

  useEffect(() => {
    if (!activeCustomFieldCategoryID) return

    const updatePosition = () => positionAddFieldPopover(true)
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const popoverEl = addFieldPopoverRef.current
      const buttonEl = activeAddFieldButtonRef.current
      if (popoverEl?.contains(target) || buttonEl?.contains(target)) return
      closeAddFieldPopover()
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAddFieldPopover()
      }
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    const rafID = window.requestAnimationFrame(() => {
      updatePosition()
    })

    return () => {
      window.cancelAnimationFrame(rafID)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [activeCustomFieldCategoryID])

  useEffect(() => {
    if (activeCustomFieldCategoryID && !activeCategory) {
      closeAddFieldPopover()
    }
  }, [activeCategory, activeCustomFieldCategoryID])

  // Event-driven: clear search when closing modal
  const closeCategoryModal = () => {
    setCategorySearch('')
    setIsCategoryModalOpen(false)
  }

  const persistCategorySelection = async (nextCategoryIDs: string[]) => {
    return onPersistSelectedCategories(nextCategoryIDs)
  }

  const handleAddCategory = async (
    categoryID: string,
    insertPosition: 'start' | 'end' = addCategoryInsertPosition,
  ) => {
    if (selectedCategoryIds.includes(categoryID)) return
    if (isCategoryQuotaExhausted) {
      showCategoryQuotaLimit()
      return
    }
    if (!canAddMoreCategories) return
    const nextCategoryIDs =
      insertPosition === 'start'
        ? [categoryID, ...selectedCategoryIds]
        : [...selectedCategoryIds, categoryID]
    const ok = await persistCategorySelection(nextCategoryIDs)
    if (ok) {
      closeCategoryModal()
    }
  }

  const handleCreateCategory = async () => {
    if (!canCreateCustomCategory) return
    if (isCategoryQuotaExhausted) {
      showCategoryQuotaLimit()
      return
    }
    if (!canAddMoreCategories) return
    const ok = await onCreateCustomCategory(categorySearch.trim(), {
      insertPosition: addCategoryInsertPosition,
    })
    if (ok) {
      closeCategoryModal()
    }
  }

  const handleAddOtherCategory = async () => {
    if (isCategoryQuotaExhausted) {
      showCategoryQuotaLimit()
      return
    }
    if (!canAddMoreCategories) return
    const baseName = t('vault.policies.otherCategory.defaultName')
    const name = nextOtherCategoryName(
      categories.map((category) => category.name),
      baseName,
    )
    const ok = await onCreateCustomCategory(name, {
      insertPosition: addCategoryInsertPosition,
    })
    if (ok) {
      closeCategoryModal()
    }
  }

  const startEditingField = (fieldID: string, label: string) => {
    setEditingFieldID(fieldID)
    setEditingFieldLabel(label)
  }

  const cancelEditingField = () => {
    setEditingFieldID(null)
    setEditingFieldLabel('')
  }

  const submitFieldRename = async (fieldID: string) => {
    if (isUpdatingField) return
    const label = editingFieldLabel.trim()
    if (!label) {
      cancelEditingField()
      return
    }
    const ok = await onRenameField({
      fieldId: fieldID,
      label,
    })
    if (ok) {
      cancelEditingField()
    }
  }

  const startEditingCategory = (categoryID: string, name: string) => {
    setEditingCategoryID(categoryID)
    setEditingCategoryName(name)
  }

  const cancelEditingCategory = () => {
    setEditingCategoryID(null)
    setEditingCategoryName('')
  }

  const submitCategoryRename = async (categoryID: string) => {
    if (isUpdatingCustomCategory) return
    const name = editingCategoryName.trim()
    if (!name) {
      cancelEditingCategory()
      return
    }
    const ok = await onRenameCustomCategory({
      categoryId: categoryID,
      name,
    })
    if (ok) {
      cancelEditingCategory()
    }
  }

  const handleRemoveCategory = (categoryID: string, categoryName: string) => {
    setCategoryPendingRemoval({
      id: categoryID,
      name: categoryName,
    })
  }

  const closeRemoveCategoryDialog = () => {
    if (isSavingCategories || isDeletingCustomCategory) return
    setCategoryPendingRemoval(null)
  }

  const confirmRemoveCategory = async () => {
    if (!categoryPendingRemoval) return
    const category = categories.find((entry) => entry.id === categoryPendingRemoval.id)
    const ok =
      category?.source === 'custom'
        ? await onDeleteCustomCategory(categoryPendingRemoval.id)
        : await persistCategorySelection(
            selectedCategoryIds.filter((id) => id !== categoryPendingRemoval.id),
          )
    if (ok) {
      setCategoryPendingRemoval(null)
    }
  }

  const closeDeleteColumnDialog = () => {
    if (isDeletingCustomField) return
    setColumnPendingDeletion(null)
  }

  const confirmDeleteColumn = async () => {
    if (!columnPendingDeletion) return
    const ok = await onDeleteCustomField({
      fieldId: columnPendingDeletion.fieldId,
      categoryTemplateId: columnPendingDeletion.categoryTemplateId,
      fieldKey: columnPendingDeletion.fieldKey,
    })
    if (ok) {
      setColumnPendingDeletion(null)
    }
  }

  const closeDeleteRowDialog = () => {
    setRowPendingDeletion(null)
  }

  const confirmDeleteRow = () => {
    if (!rowPendingDeletion) return
    removeRow(rowPendingDeletion.categoryTemplateId, rowPendingDeletion.rowId)
    setRowPendingDeletion(null)
  }

  const inputBaseClassName =
    'w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 typo-body-sm text-slate-700 transition placeholder:text-slate-400 hover:border-slate-200 hover:bg-white focus:border-ep-primary-accent focus:bg-white focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-ep-border-card dark:hover:bg-ep-surface-subtle dark:focus:bg-ep-surface-subtle'
  const mobileInputClassName =
    'ep-assets-input'
  const wrappingTextClassName = `${inputBaseClassName} min-h-[2.25rem] min-w-0 resize overflow-auto scrollbar-hidden`
  const mobileWrappingTextClassName = `${mobileInputClassName} min-h-[2.5rem] min-w-0 resize overflow-auto scrollbar-hidden`
  const fieldHeadingLabel = (field: { id: string; label: string }) =>
    resolveAssetFieldHeadingLabel(field.id, field.label, editingFieldID, editingFieldLabel)
  const fieldInputPlaceholder = (field: { id: string; label: string }) =>
    t('vault.policies.cellPlaceholder', {
      label: fieldHeadingLabel(field) || t('vault.policies.cellPlaceholderFallback'),
    })
  const fieldSelectPlaceholder = (field: { id: string; label: string }) =>
    t('vault.policies.cellSelectPlaceholder', {
      label: fieldHeadingLabel(field) || t('vault.policies.cellPlaceholderFallback'),
    })
  const activeModalAttachment = activeAttachmentModal?.attachment ?? null
  const activeModalLinkedDocument = activeAttachmentModal?.linkedDocument ?? null
  const isAttachmentModalOpen = attachmentModalCell != null && activeAttachmentModal != null
  const activeDrawerAttachment = activeAttachmentDrawer?.attachment ?? null
  const activeDrawerLinkedDocument = activeAttachmentDrawer?.linkedDocument ?? null
  const isAttachmentDrawerOpen = attachmentDrawerCell != null && activeAttachmentDrawer != null
  const activeContactModal = useMemo(() => {
    if (!contactModalCell) return null
    const categoryView = selectedCategoryViews.find(
      ({ category }) => category.id === contactModalCell.categoryId,
    )
    if (!categoryView) return null
    const field = categoryView.fields.find((entry) => entry.key === contactModalCell.fieldKey)
    const row = categoryView.rows.find((entry) => entry.id === contactModalCell.rowId)
    if (!field || !row) return null
    const value = row.values[field.key] ?? ''
    const parsed = parseAssetContactCellValue(value)
    return {
      categoryId: categoryView.category.id,
      rowId: row.id,
      fieldKey: field.key,
      title: field.label || t('vault.policies.contacts.pickerTitle'),
      value,
      selectedContactId:
        parsed.kind === 'contact_link' ? parsed.reference.contactId : null,
    }
  }, [contactModalCell, selectedCategoryViews, t])
  const isContactModalOpen = contactModalCell != null && activeContactModal != null

  const commitMoneyCellValue = (
    categoryTemplateId: string,
    rowId: string,
    fieldKey: string,
    raw: string,
  ) => {
    const next = finalizeMoneyValue(raw)
    if (next !== raw) {
      setCellValue(categoryTemplateId, rowId, fieldKey, next)
    }
  }

  const isEditableElement = (element: EventTarget | null): element is HTMLElement => {
    if (!(element instanceof HTMLElement)) return false
    if (element.isContentEditable) return true
    const tag = element.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
  }

  const handleEditorFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (!isEditableElement(event.target)) return
    onEditorActivityChange(true)
  }

  const handleEditorBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (!isEditableElement(event.target)) return
    const next = event.relatedTarget
    if (isEditableElement(next)) return
    onEditorActivityChange(false)
  }

  return (
    <div
      className="space-y-5 overflow-x-hidden"
      onFocusCapture={handleEditorFocusCapture}
      onBlurCapture={handleEditorBlurCapture}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title={t('nav.policies')}
          description={t('vault.sectionPage.policiesSubtitle')}
          descriptionClassName="text-slate-500 dark:text-slate-400"
        />
        {canPersistAssets ? (
          <Button
            type="button"
            variant="primary"
            className={cn('gap-2', isCategoryQuotaExhausted && 'opacity-60')}
            onClick={() => openAddCategoryFlow('start')}
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            {t('vault.policies.emptyCategories.addCategory')}
          </Button>
        ) : null}
      </div>

      <VaultPoliciesSuggestionsPanel
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        interactive={canPersistAssets}
        quotaExhausted={isCategoryQuotaExhausted}
        onAddCategory={(categoryId) => void handleAddCategory(categoryId, 'start')}
        onQuotaExhausted={showCategoryQuotaLimit}
      />

      {selectedCategoryViews.length === 0 ? (
        <Card className="flex min-h-[22rem] flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[26rem]">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ep-primary-softer text-ep-primary dark:bg-ep-primary/15">
            <Briefcase className="h-7 w-7" strokeWidth={1.6} aria-hidden />
          </div>
          <h3 className="typo-heading-card text-ep-body dark:text-white">
            {t('vault.policies.emptyCategories.title')}
          </h3>
          <p className="mt-2 max-w-md typo-body-sm text-slate-500 dark:text-slate-400">
            {t('vault.policies.emptyCategories.description')}
          </p>
          <Button
            type="button"
            variant="primary"
            className={cn('mt-6 gap-2', isCategoryQuotaExhausted && 'opacity-60')}
            onClick={() => openAddCategoryFlow('start')}
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            {t('vault.policies.emptyCategories.addCategory')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-10">
        {selectedCategoryViews.map(({ category, fields, rows }) => {
          return (
            <section
              key={category.id}
              className="ep-category-panel"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-ep-border-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  {category.source === 'custom' && canPersistAssets ? (
                    editingCategoryID === category.id ? (
                      <input
                        value={editingCategoryName}
                        onChange={(event) => setEditingCategoryName(event.currentTarget.value)}
                        onBlur={() => void submitCategoryRename(category.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void submitCategoryRename(category.id)
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault()
                            cancelEditingCategory()
                          }
                        }}
                        disabled={isUpdatingCustomCategory}
                        autoFocus
                        aria-label={t('vault.policies.renameCategory.inputAriaLabel')}
                        className="typo-heading-card rounded border border-slate-300 bg-white px-2 py-0.5 text-slate-900 outline-none focus:border-ep-primary dark:border-ep-border-card dark:bg-ep-surface-panel dark:text-slate-100"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingCategory(category.id, category.name)}
                        className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition hover:bg-slate-100 hover:text-ep-primary dark:hover:bg-ep-surface-panel dark:hover:text-ep-primary-muted"
                        aria-label={t('vault.policies.renameCategory.editAriaLabel', {
                          name: category.name,
                        })}
                      >
                        <h3 className="typo-heading-card text-slate-900 dark:text-slate-100">
                          {category.name}
                        </h3>
                        <Pencil className="h-3.5 w-3.5 opacity-60" />
                      </button>
                    )
                  ) : (
                    <h3 className="typo-heading-card text-slate-900 dark:text-slate-100">
                      {category.name}
                    </h3>
                  )}
                  <span className="typo-caption text-slate-500 dark:text-slate-400">{rows.length} rows</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(category.id, category.name)}
                  disabled={isSavingCategories}
                  className="inline-flex items-center gap-1.5 typo-body-sm text-slate-500 transition hover:text-red-600 disabled:opacity-60 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete category
                </button>
              </div>

              {category.description && (
                <p className="px-4 pt-3 typo-body-sm text-slate-500 dark:text-slate-400">
                  {category.description}
                </p>
              )}

              <div className="px-4 pb-4 pt-3">
                <div className="relative">
                  <div className="ep-data-table-wrap hidden lg:block">
                    <table className="w-full min-w-[820px] border-collapse">
                      <thead className="ep-data-table-head">
                        <tr>
                          {fields.map((field, fieldIndex) => (
                            <th
                              key={`${category.id}-${field.key}`}
                              className={cn(assetsTableHeaderCellClass(fieldIndex, fields.length), 'group')}
                            >
                              <div className="flex items-center justify-between gap-2">
                                {editingFieldID === field.id ? (
                                  <input
                                    value={editingFieldLabel}
                                    onChange={(event) => setEditingFieldLabel(event.currentTarget.value)}
                                    onBlur={() => void submitFieldRename(field.id)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') {
                                        event.preventDefault()
                                        void submitFieldRename(field.id)
                                      }
                                      if (event.key === 'Escape') {
                                        event.preventDefault()
                                        cancelEditingField()
                                      }
                                    }}
                                    autoFocus
                                    className="w-full rounded border border-ep-primary-muted bg-white px-1.5 py-1 typo-caption-strong text-slate-700 outline-none dark:border-ep-primary/60 dark:bg-ep-surface-subtle dark:text-slate-100"
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startEditingField(field.id, field.label)}
                                    className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-left transition hover:bg-slate-100 hover:text-ep-primary dark:hover:bg-ep-surface-panel dark:hover:text-ep-primary-muted"
                                  >
                                    <span>
                                      {field.label}
                                      {field.required ? ' *' : ''}
                                    </span>
                                    <Pencil className="h-3 w-3 opacity-60" />
                                  </button>
                                )}
                                {field.source === 'custom' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    loading={isDeletingCustomField}
                                    className={cn(
                                      'h-6 min-h-0 px-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
                                      assetsTableDeleteActionClassName,
                                    )}
                                    onClick={() =>
                                      setColumnPendingDeletion({
                                        fieldId: field.id,
                                        categoryTemplateId: category.id,
                                        fieldKey: field.key,
                                        fieldLabel: field.label,
                                        categoryName: category.name,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </th>
                          ))}
                          <th className={ASSETS_FLOAT_ACTIONS_TH}>
                            <button
                              type="button"
                              onClick={(event) =>
                                toggleAddFieldPopover(category.id, event.currentTarget as HTMLButtonElement)
                              }
                              className="inline-flex w-full flex-col items-center gap-1 rounded-lg px-1 py-1.5 typo-caption-strong text-slate-500 transition hover:bg-slate-200/70 hover:text-ep-primary dark:text-slate-400 dark:hover:bg-ep-surface-panel dark:hover:text-ep-primary-muted"
                            >
                              <Plus className="h-4 w-4 shrink-0" />
                              <span className="max-w-[3.25rem] text-center typo-caption-emphasis leading-tight">
                                {t('vault.policies.addTableColumn')}
                              </span>
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={fields.length + 1}
                              className="border-b border-slate-200 px-3 py-6 text-center typo-body-sm text-slate-500 first:border-l dark:border-ep-border-card dark:text-slate-400"
                            >
                              No policies yet. Add your first row.
                            </td>
                          </tr>
                        ) : (
                          rows.map((row, rowIndex) => (
                            <tr key={row.id} className="group align-top">
                              {fields.map((field, fieldIndex) => {
                                const value = row.values[field.key] ?? ''
                                const focusFirstColumn =
                                  focusNewRowFirstCell?.categoryId === category.id &&
                                  focusNewRowFirstCell?.rowId === row.id &&
                                  fieldIndex === 0
                                if (field.fieldType === 'textarea' || field.fieldType === 'text') {
                                  return (
                                    <td
                                      key={`${row.id}-${field.key}`}
                                      className={assetsTableBodyDataCellClass(fieldIndex, fields.length)}
                                    >
                                      <PolicyWrappingTextCell
                                        value={value}
                                        autoFocus={focusFirstColumn}
                                        placeholder={fieldInputPlaceholder(field)}
                                        className={wrappingTextClassName}
                                        onChange={(nextValue) =>
                                          setCellValue(category.id, row.id, field.key, nextValue)
                                        }
                                      />
                                    </td>
                                  )
                                }
                                if (field.fieldType === 'select' && field.options && field.options.length > 0) {
                                  return (
                                    <td
                                      key={`${row.id}-${field.key}`}
                                      className={assetsTableBodyDataCellClass(fieldIndex, fields.length)}
                                    >
                                      <select
                                        value={value}
                                        autoFocus={focusFirstColumn}
                                        onChange={(event) =>
                                          setCellValue(category.id, row.id, field.key, event.currentTarget.value)
                                        }
                                        className={inputBaseClassName}
                                      >
                                        <option value="">{fieldSelectPlaceholder(field)}</option>
                                        {field.options.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                  )
                                }
                                if (field.fieldType === 'attachment') {
                                  const parsedValue = parseAssetAttachmentCellValue(value)
                                  const attachment =
                                    parsedValue.kind === 'asset_attachment'
                                      ? attachmentsById[parsedValue.attachmentId] ?? null
                                      : null
                                  const linkedDocument =
                                    parsedValue.kind === 'document_link'
                                      ? documentsFilesById[parsedValue.reference.fileId] ?? null
                                      : null
                                  const cellKey = `${category.id}:${row.id}:${field.key}`
                                  return (
                                    <td
                                      key={`${row.id}-${field.key}`}
                                      className={assetsTableBodyDataCellClass(fieldIndex, fields.length)}
                                    >
                                      <AssetAttachmentCell
                                        value={value}
                                        label={
                                          attachment?.name ??
                                          linkedDocument?.name ??
                                          (parsedValue.kind === 'document_link'
                                            ? parsedValue.reference.fileName
                                            : null) ??
                                          undefined
                                        }
                                        isBusy={activeAttachmentCellKey === cellKey}
                                        autoFocus={focusFirstColumn}
                                        onOpen={() => {
                                          setAttachmentDrawerCell(null)
                                          setAttachmentModalCell({
                                            categoryId: category.id,
                                            rowId: row.id,
                                            fieldKey: field.key,
                                          })
                                        }}
                                        onView={() => {
                                          openVaultPolicyAttachmentView({
                                            value,
                                            attachmentsById,
                                            documentsFilesById,
                                            onViewLinkedDocument,
                                            onViewAttachment,
                                          })
                                        }}
                                        onDelete={() =>
                                          onClearAttachment({
                                            categoryTemplateId: category.id,
                                            rowId: row.id,
                                            fieldKey: field.key,
                                          })
                                        }
                                      />
                                    </td>
                                  )
                                }
                                if (field.fieldType === 'contact') {
                                  const contactLabel = resolveAssetContactCellLabel(value, contactsById)
                                  return (
                                    <td
                                      key={`${row.id}-${field.key}`}
                                      className={assetsTableBodyDataCellClass(fieldIndex, fields.length)}
                                    >
                                      <AssetContactCell
                                        value={value}
                                        label={contactLabel}
                                        isMissing={Boolean(value.trim()) && !contactLabel}
                                        autoFocus={focusFirstColumn}
                                        onOpen={() =>
                                          setContactModalCell({
                                            categoryId: category.id,
                                            rowId: row.id,
                                            fieldKey: field.key,
                                          })
                                        }
                                        onView={() => navigate(endplanSectionPath(SECTION_ID.CONTACTS))}
                                        onDelete={() =>
                                          onClearContact({
                                            categoryTemplateId: category.id,
                                            rowId: row.id,
                                            fieldKey: field.key,
                                          })
                                        }
                                      />
                                    </td>
                                  )
                                }
                                if (field.fieldType === 'password') {
                                  const passwordCellKey = `${category.id}:${row.id}:${field.key}`
                                  const passwordVisible = Boolean(passwordRevealByCell[passwordCellKey])
                                  return (
                                    <td
                                      key={`${row.id}-${field.key}`}
                                      className={assetsTableBodyDataCellClass(fieldIndex, fields.length)}
                                    >
                                      <div className="flex min-w-0 items-center gap-1">
                                        <input
                                          type={passwordVisible ? 'text' : 'password'}
                                          value={value}
                                          autoComplete="new-password"
                                          autoFocus={focusFirstColumn}
                                          placeholder={fieldInputPlaceholder(field)}
                                          onChange={(event) =>
                                            setCellValue(category.id, row.id, field.key, event.currentTarget.value)
                                          }
                                          className={`${inputBaseClassName} min-w-0 flex-1`}
                                        />
                                        <button
                                          type="button"
                                          className="inline-flex shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/40 dark:hover:text-slate-100"
                                          aria-label={
                                            passwordVisible
                                              ? t('vault.policies.passwordField.hidePasswordAria')
                                              : t('vault.policies.passwordField.showPasswordAria')
                                          }
                                          aria-pressed={passwordVisible}
                                          onClick={() =>
                                            setPasswordRevealByCell((prev) => ({
                                              ...prev,
                                              [passwordCellKey]: !prev[passwordCellKey],
                                            }))
                                          }
                                        >
                                          {passwordVisible ? (
                                            <EyeOff className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                                          ) : (
                                            <Eye className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                  )
                                }
                                if (field.fieldType === 'value') {
                                  return (
                                    <td
                                      key={`${row.id}-${field.key}`}
                                      className={assetsTableBodyDataCellClass(fieldIndex, fields.length)}
                                    >
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={value}
                                        autoFocus={focusFirstColumn}
                                        placeholder={fieldInputPlaceholder(field)}
                                        onChange={(event) =>
                                          setCellValue(
                                            category.id,
                                            row.id,
                                            field.key,
                                            sanitizeMoneyInput(event.currentTarget.value),
                                          )
                                        }
                                        onBlur={(event) =>
                                          commitMoneyCellValue(
                                            category.id,
                                            row.id,
                                            field.key,
                                            event.currentTarget.value,
                                          )
                                        }
                                        onFocus={() =>
                                          commitMoneyCellValue(category.id, row.id, field.key, value)
                                        }
                                        className={inputBaseClassName}
                                      />
                                    </td>
                                  )
                                }
                                return (
                                  <td
                                    key={`${row.id}-${field.key}`}
                                    className={assetsTableBodyDataCellClass(fieldIndex, fields.length)}
                                  >
                                    <input
                                      type={
                                        field.fieldType === 'number'
                                          ? 'number'
                                          : field.fieldType === 'date'
                                            ? 'date'
                                            : 'text'
                                      }
                                      value={value}
                                      autoFocus={focusFirstColumn}
                                      placeholder={fieldInputPlaceholder(field)}
                                      onChange={(event) =>
                                        setCellValue(category.id, row.id, field.key, event.currentTarget.value)
                                      }
                                      className={inputBaseClassName}
                                    />
                                  </td>
                                )
                              })}
                              <td className={ASSETS_FLOAT_ACTIONS_TD}>
                                <span className="sr-only">
                                  {t('vault.policies.deleteRowDialog.rowActionsColumnAriaLabel')}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setRowPendingDeletion({
                                      categoryTemplateId: category.id,
                                      rowId: row.id,
                                      categoryName: category.name,
                                      rowNumber: rowIndex + 1,
                                    })
                                  }
                                  className={cn(
                                    'rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:text-red-400 dark:hover:text-red-300',
                                    assetsTableDeleteActionClassName,
                                  )}
                                  aria-label={t('vault.policies.deleteRowDialog.deleteRowButtonAriaLabel')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                        <tr>
                          <td
                            colSpan={fields.length}
                            className="border-b border-slate-200 px-3 py-2 first:border-l dark:border-ep-border-card"
                          >
                            <button
                              type="button"
                              onClick={() => handleAddRow(category.id, fields.map((field) => field.key))}
                              className={cn(
                                'inline-flex items-center gap-1.5 typo-body-sm text-slate-500 transition dark:text-slate-400',
                                canAddRowInCategory(category.id)
                                  ? 'hover:text-ep-primary dark:hover:text-ep-primary-muted'
                                  : 'opacity-50',
                              )}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add row
                            </button>
                          </td>
                          <td className={ASSETS_FLOAT_ACTIONS_TD} aria-hidden />
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="ep-data-table-wrap lg:hidden divide-y divide-slate-200 dark:divide-ep-border-card">
                    <div className="ep-data-table-head flex items-center justify-between px-3 py-2">
                      <span className="typo-caption-strong text-slate-600 dark:text-slate-300">
                        {rows.length} rows
                      </span>
                      <button
                        type="button"
                        onClick={(event) =>
                          toggleAddFieldPopover(category.id, event.currentTarget as HTMLButtonElement)
                        }
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 typo-caption-strong text-slate-500 transition hover:bg-slate-200/70 hover:text-ep-primary dark:text-slate-400 dark:hover:bg-ep-surface-panel dark:hover:text-ep-primary-muted"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('vault.policies.addTableColumn')}
                      </button>
                    </div>
                    {rows.length === 0 ? (
                      <div className="px-3 py-5 text-center space-y-2">
                        <p className="typo-body-sm text-slate-500 dark:text-slate-400">
                          No policies yet. Add your first row.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddRow(category.id, fields.map((field) => field.key))}
                          className={cn(
                            'inline-flex items-center gap-1.5 typo-body-sm text-slate-500 transition dark:text-slate-400',
                            canAddRowInCategory(category.id)
                              ? 'hover:text-ep-primary dark:hover:text-ep-primary-muted'
                              : 'opacity-50',
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add row
                        </button>
                      </div>
                    ) : (
                      <>
                        {rows.map((row, index) => (
                          <div key={row.id} className="group flex items-stretch gap-0">
                            <div className="min-w-0 flex-1 space-y-3 p-3">
                              <p className="typo-caption-strong text-slate-600 dark:text-slate-300">
                                Row {index + 1}
                              </p>

                              {fields.map((field, fieldIndex) => {
                                const value = row.values[field.key] ?? ''
                                const focusFirstColumn =
                                  focusNewRowFirstCell?.categoryId === category.id &&
                                  focusNewRowFirstCell?.rowId === row.id &&
                                  fieldIndex === 0
                                return (
                                  <div key={`${row.id}-${field.key}`} className="group space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      {editingFieldID === field.id ? (
                                        <input
                                          value={editingFieldLabel}
                                          onChange={(event) => setEditingFieldLabel(event.currentTarget.value)}
                                          onBlur={() => void submitFieldRename(field.id)}
                                          onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                              event.preventDefault()
                                              void submitFieldRename(field.id)
                                            }
                                            if (event.key === 'Escape') {
                                              event.preventDefault()
                                              cancelEditingField()
                                            }
                                          }}
                                          autoFocus
                                          className="w-full rounded border border-ep-primary-muted bg-white px-1.5 py-1 typo-caption-strong text-slate-700 outline-none dark:border-ep-primary/60 dark:bg-ep-surface-subtle dark:text-slate-100"
                                        />
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => startEditingField(field.id, field.label)}
                                          className="inline-flex items-center gap-1 rounded px-1 py-0.5 typo-caption-strong text-slate-600 transition hover:bg-slate-100 hover:text-ep-primary dark:text-slate-300 dark:hover:bg-ep-surface-panel dark:hover:text-ep-primary-muted"
                                        >
                                          <span>
                                            {field.label}
                                            {field.required ? ' *' : ''}
                                          </span>
                                          <Pencil className="h-3 w-3 opacity-60" />
                                        </button>
                                      )}
                                      {field.source === 'custom' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          loading={isDeletingCustomField}
                                          className={cn(
                                            'h-6 min-h-0 px-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
                                            assetsTableDeleteActionClassName,
                                          )}
                                          onClick={() =>
                                            setColumnPendingDeletion({
                                              fieldId: field.id,
                                              categoryTemplateId: category.id,
                                              fieldKey: field.key,
                                              fieldLabel: field.label,
                                              categoryName: category.name,
                                            })
                                          }
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>

                                    {field.fieldType === 'textarea' || field.fieldType === 'text' ? (
                                      <PolicyWrappingTextCell
                                        value={value}
                                        autoFocus={focusFirstColumn}
                                        placeholder={fieldInputPlaceholder(field)}
                                        className={mobileWrappingTextClassName}
                                        onChange={(nextValue) =>
                                          setCellValue(category.id, row.id, field.key, nextValue)
                                        }
                                      />
                                    ) : field.fieldType === 'select' && field.options && field.options.length > 0 ? (
                                      <select
                                        value={value}
                                        autoFocus={focusFirstColumn}
                                        onChange={(event) =>
                                          setCellValue(category.id, row.id, field.key, event.currentTarget.value)
                                        }
                                        className={mobileInputClassName}
                                      >
                                        <option value="">{fieldSelectPlaceholder(field)}</option>
                                        {field.options.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    ) : field.fieldType === 'attachment' ? (
                                      (() => {
                                        const parsedValue = parseAssetAttachmentCellValue(value)
                                        const attachment =
                                          parsedValue.kind === 'asset_attachment'
                                            ? attachmentsById[parsedValue.attachmentId] ?? null
                                            : null
                                        const linkedDocument =
                                          parsedValue.kind === 'document_link'
                                            ? documentsFilesById[parsedValue.reference.fileId] ?? null
                                            : null
                                        return (
                                          <AssetAttachmentCell
                                            value={value}
                                            label={
                                              attachment?.name ??
                                              linkedDocument?.name ??
                                              (parsedValue.kind === 'document_link'
                                                ? parsedValue.reference.fileName
                                                : null) ??
                                              undefined
                                            }
                                            isBusy={
                                              activeAttachmentCellKey === `${category.id}:${row.id}:${field.key}`
                                            }
                                            autoFocus={focusFirstColumn}
                                            onOpen={() => {
                                              setAttachmentDrawerCell(null)
                                              setAttachmentModalCell({
                                                categoryId: category.id,
                                                rowId: row.id,
                                                fieldKey: field.key,
                                              })
                                            }}
                                            onView={() => {
                                              openVaultPolicyAttachmentView({
                                                value,
                                                attachmentsById,
                                                documentsFilesById,
                                                onViewLinkedDocument,
                                                onViewAttachment,
                                              })
                                            }}
                                            onDelete={() =>
                                              onClearAttachment({
                                                categoryTemplateId: category.id,
                                                rowId: row.id,
                                                fieldKey: field.key,
                                              })
                                            }
                                          />
                                        )
                                      })()
                                    ) : field.fieldType === 'contact' ? (
                                      (() => {
                                        const contactLabel = resolveAssetContactCellLabel(value, contactsById)
                                        return (
                                          <AssetContactCell
                                            value={value}
                                            label={contactLabel}
                                            isMissing={Boolean(value.trim()) && !contactLabel}
                                            autoFocus={focusFirstColumn}
                                            onOpen={() =>
                                              setContactModalCell({
                                                categoryId: category.id,
                                                rowId: row.id,
                                                fieldKey: field.key,
                                              })
                                            }
                                            onView={() => navigate(endplanSectionPath(SECTION_ID.CONTACTS))}
                                            onDelete={() =>
                                              onClearContact({
                                                categoryTemplateId: category.id,
                                                rowId: row.id,
                                                fieldKey: field.key,
                                              })
                                            }
                                          />
                                        )
                                      })()
                                    ) : field.fieldType === 'password' ? (
                                      (() => {
                                        const passwordCellKey = `${category.id}:${row.id}:${field.key}`
                                        const passwordVisible = Boolean(passwordRevealByCell[passwordCellKey])
                                        return (
                                          <div className="flex min-w-0 items-center gap-1">
                                            <input
                                              type={passwordVisible ? 'text' : 'password'}
                                              value={value}
                                              autoComplete="new-password"
                                              autoFocus={focusFirstColumn}
                                              placeholder={fieldInputPlaceholder(field)}
                                              onChange={(event) =>
                                                setCellValue(
                                                  category.id,
                                                  row.id,
                                                  field.key,
                                                  event.currentTarget.value,
                                                )
                                              }
                                              className={`${mobileInputClassName} min-w-0 flex-1`}
                                            />
                                            <button
                                              type="button"
                                              className="inline-flex shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/40 dark:hover:text-slate-100"
                                              aria-label={
                                                passwordVisible
                                                  ? t('vault.policies.passwordField.hidePasswordAria')
                                                  : t('vault.policies.passwordField.showPasswordAria')
                                              }
                                              aria-pressed={passwordVisible}
                                              onClick={() =>
                                                setPasswordRevealByCell((prev) => ({
                                                  ...prev,
                                                  [passwordCellKey]: !prev[passwordCellKey],
                                                }))
                                              }
                                            >
                                              {passwordVisible ? (
                                                <EyeOff className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                                              ) : (
                                                <Eye className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                                              )}
                                            </button>
                                          </div>
                                        )
                                      })()
                                    ) : field.fieldType === 'value' ? (
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={value}
                                        autoFocus={focusFirstColumn}
                                        placeholder={fieldInputPlaceholder(field)}
                                        onChange={(event) =>
                                          setCellValue(
                                            category.id,
                                            row.id,
                                            field.key,
                                            sanitizeMoneyInput(event.currentTarget.value),
                                          )
                                        }
                                        onBlur={(event) =>
                                          commitMoneyCellValue(
                                            category.id,
                                            row.id,
                                            field.key,
                                            event.currentTarget.value,
                                          )
                                        }
                                        onFocus={() =>
                                          commitMoneyCellValue(category.id, row.id, field.key, value)
                                        }
                                        className={mobileInputClassName}
                                      />
                                    ) : field.fieldType === 'number' || field.fieldType === 'date' ? (
                                      <input
                                        type={field.fieldType === 'number' ? 'number' : 'date'}
                                        value={value}
                                        autoFocus={focusFirstColumn}
                                        placeholder={fieldInputPlaceholder(field)}
                                        onChange={(event) =>
                                          setCellValue(category.id, row.id, field.key, event.currentTarget.value)
                                        }
                                        className={mobileInputClassName}
                                      />
                                    ) : (
                                      <PolicyWrappingTextCell
                                        value={value}
                                        autoFocus={focusFirstColumn}
                                        placeholder={fieldInputPlaceholder(field)}
                                        className={mobileWrappingTextClassName}
                                        onChange={(nextValue) =>
                                          setCellValue(category.id, row.id, field.key, nextValue)
                                        }
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            <div className="flex shrink-0 flex-col items-center justify-start px-2 py-3">
                              <span className="sr-only">
                                {t('vault.policies.deleteRowDialog.rowActionsColumnAriaLabel')}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setRowPendingDeletion({
                                    categoryTemplateId: category.id,
                                    rowId: row.id,
                                    categoryName: category.name,
                                    rowNumber: index + 1,
                                  })
                                }
                                className={cn(
                                  'rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:text-red-400 dark:hover:text-red-300',
                                  assetsTableDeleteActionClassName,
                                )}
                                aria-label={t('vault.policies.deleteRowDialog.deleteRowButtonAriaLabel')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleAddRow(category.id, fields.map((field) => field.key))}
                            className={cn(
                              'inline-flex items-center gap-1.5 typo-body-sm text-slate-500 transition dark:text-slate-400',
                              canAddRowInCategory(category.id)
                                ? 'hover:text-ep-primary dark:hover:text-ep-primary-muted'
                                : 'opacity-50',
                            )}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add row
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </div>
            </section>
          )
        })}
        </div>
      )}
      {selectedCategoryViews.length > 0 && canPersistAssets ? (
        <div className="px-1">
          <Button
            type="button"
            variant="primary"
            className={cn('gap-2', isCategoryQuotaExhausted && 'opacity-60')}
            onClick={() => openAddCategoryFlow('end')}
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            {t('vault.policies.emptyCategories.addCategory')}
          </Button>
        </div>
      ) : null}
      <VaultCategoryQuotaLimitModal
        isOpen={quotaLimitModalKind != null}
        kind={quotaLimitModalKind ?? 'category'}
        onClose={() => setQuotaLimitModalKind(null)}
      />
      {isAttachmentModalOpen && activeAttachmentModal && (
        <AssetAttachmentModal
          key={`${activeAttachmentModal.categoryId}:${activeAttachmentModal.rowId}:${activeAttachmentModal.fieldKey}:${activeAttachmentModal.value}`}
          title={activeAttachmentModal.title}
          hasValue={Boolean(activeAttachmentModal.value)}
          existingDocumentName={activeAttachmentModal.currentLabel ?? null}
          isBusy={activeAttachmentModal.isBusy || isVaultDocumentsActionBusy}
          canManageDocuments={canManageDocuments}
          documentsFolders={documentsFolders}
          documentsFiles={documentsFiles}
          onClose={() => {
            setAttachmentModalCell(null)
            setAttachmentDrawerCell(null)
          }}
          onCreateDocumentsFolder={onCreateDocumentsFolder}
          onUploadDocumentToFolder={onUploadDocumentToFolder}
          onLinkDocument={(file) => {
            void onLinkDocument({
              categoryTemplateId: activeAttachmentModal.categoryId,
              rowId: activeAttachmentModal.rowId,
              fieldKey: activeAttachmentModal.fieldKey,
              file,
            }).then((ok) => {
              if (ok) {
                setAttachmentModalCell(null)
              }
            })
          }}
          onDownloadCurrent={
            activeModalAttachment
              ? () => void onDownloadAttachment(activeModalAttachment)
              : activeModalLinkedDocument
                ? () => void onDownloadLinkedDocument(activeModalLinkedDocument)
                : undefined
          }
          onDeleteCurrent={
            activeAttachmentModal.value
              ? () => {
                  onClearAttachment({
                    categoryTemplateId: activeAttachmentModal.categoryId,
                    rowId: activeAttachmentModal.rowId,
                    fieldKey: activeAttachmentModal.fieldKey,
                  })
                  setAttachmentModalCell(null)
                }
              : undefined
          }
        />
      )}
      {isContactModalOpen && activeContactModal ? (
        <AssetContactPickerModal
          title={activeContactModal.title}
          contacts={contactOptions}
          selectedContactId={activeContactModal.selectedContactId}
          onClose={() => setContactModalCell(null)}
          onSelect={(contact) => {
            void onLinkContact({
              categoryTemplateId: activeContactModal.categoryId,
              rowId: activeContactModal.rowId,
              fieldKey: activeContactModal.fieldKey,
              contact: { id: contact.id, label: contact.label },
            }).then((ok) => {
              if (ok) setContactModalCell(null)
            })
          }}
        />
      ) : null}
      {isAttachmentDrawerOpen && activeAttachmentDrawer && (
        <AssetAttachmentDrawer
          isOpen
          title={activeAttachmentDrawer.title}
          hasAttachmentValue={Boolean(activeAttachmentDrawer.value)}
          attachment={mapAttachmentOrLinkedDocToDrawerModel(
            activeDrawerAttachment,
            activeDrawerLinkedDocument,
          )}
          isBusy={activeAttachmentDrawer.isBusy}
          onClose={() => setAttachmentDrawerCell(null)}
          onUpload={(file) => {
            void onUploadAttachment({
              categoryTemplateId: activeAttachmentDrawer.categoryId,
              rowId: activeAttachmentDrawer.rowId,
              fieldKey: activeAttachmentDrawer.fieldKey,
              file,
            }).then((ok) => {
              if (ok) {
                setAttachmentDrawerCell(null)
              }
            })
          }}
          onDownload={
            activeDrawerAttachment
              ? () => void onDownloadAttachment(activeDrawerAttachment)
              : activeDrawerLinkedDocument
                ? () => void onDownloadLinkedDocument(activeDrawerLinkedDocument)
                : undefined
          }
          onDelete={
            activeAttachmentDrawer.value
              ? () => {
                  onClearAttachment({
                    categoryTemplateId: activeAttachmentDrawer.categoryId,
                    rowId: activeAttachmentDrawer.rowId,
                    fieldKey: activeAttachmentDrawer.fieldKey,
                  })
                  setAttachmentDrawerCell(null)
                }
              : undefined
          }
        />
      )}
      <VaultDocumentViewerModal
        isOpen={documentViewer.isOpen}
        file={documentViewer.file}
        blob={documentViewer.blob}
        isLoading={documentViewer.isLoading}
        isDownloadOnly={documentViewer.isDownloadOnly}
        error={documentViewer.error}
        onClose={documentViewer.onClose}
        onDownload={documentViewer.onDownload}
      />
      {activeCustomFieldCategoryID &&
        activeCategory &&
        addFieldPopoverPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={addFieldPopoverRef}
            className={`ep-popover-surface fixed z-[80] p-3 ${
              addFieldPopoverPosition.placement === 'top'
                ? 'assets-popover-enter-up'
                : 'assets-popover-enter-down'
            }`}
            style={{
              top: addFieldPopoverPosition.top,
              left: addFieldPopoverPosition.left,
              width: addFieldPopoverPosition.width,
              transformOrigin:
                addFieldPopoverPosition.placement === 'top' ? 'bottom right' : 'top right',
            }}
          >
            <div className="space-y-2">
              <p className="typo-caption text-slate-500 dark:text-slate-400">
                Add column to {activeCategory.name}
              </p>
            </div>

            <div className="mt-1 border-t border-slate-200 pt-3 dark:border-ep-border-card">
              <div className="mb-2 flex items-center justify-between">
                <p className="typo-caption text-slate-500 dark:text-slate-400">Select type</p>
                <span className="typo-caption text-slate-500 dark:text-slate-400">
                  {customFieldTypeOptions.find((option) => option.value === activeCustomDraft.fieldType)?.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {customFieldTypeOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = activeCustomDraft.fieldType === option.value
                  const optionLabel = option.label
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateVaultPoliciesCustomFieldDraft(activeCustomFieldCategoryID, {
                          fieldType: option.value,
                        })
                      }
                      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                        isActive
                          ? 'border-ep-primary-accent bg-ep-primary-softer text-ep-primary-accent dark:border-ep-primary-accent/60 dark:bg-ep-primary/20 dark:text-ep-primary-muted'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-ep-border-card dark:text-slate-300 dark:hover:border-ep-border-card dark:hover:bg-ep-primary-dark/50'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="typo-caption">{optionLabel}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 pt-2.5 dark:border-ep-border-card">
              <Button size="sm" variant="ghost" onClick={closeAddFieldPopover}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={isAddingCustomField}
                onClick={() =>
                  void submitCustomField(activeCustomFieldCategoryID, activeCustomDraft)
                }
              >
                Add column
              </Button>
            </div>
          </div>,
          document.body,
        )}
      {isCategoryModalOpen && (
        <ModalOverlay onBackdropClick={closeCategoryModal}>
          <Card className="assets-category-modal-enter w-full max-w-xl p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-ep-border-card">
              <div>
                <h3 className="typo-heading-card text-slate-900 dark:text-slate-100">Add Policy Category</h3>
                <p className="typo-body-sm text-slate-500 dark:text-slate-400">
                  Choose a category to add as a new asset.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCategoryModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-ep-surface-panel dark:hover:text-slate-200"
                aria-label="Close category picker"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-ep-border-card dark:bg-ep-primary-dark/70">
                <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.currentTarget.value)}
                  className="w-full bg-transparent typo-body-sm text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {filteredAvailableCategories.length > 0 ? (
                <div className="space-y-2">
                  {filteredAvailableCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => void handleAddCategory(category.id)}
                      disabled={isSavingCategories}
                      className={cn(
                        'w-full rounded-lg border border-slate-200 px-3 py-2 text-left transition disabled:opacity-60 disabled:cursor-not-allowed dark:border-ep-border-card',
                        isCategoryQuotaExhausted
                          ? 'opacity-60'
                          : 'hover:border-ep-primary-muted hover:bg-ep-primary-softer/60 dark:hover:border-ep-primary/40 dark:hover:bg-ep-primary/10',
                      )}
                    >
                      <p className="typo-body-sm-emphasis text-slate-800 dark:text-slate-100">
                        {category.name}
                      </p>
                      {category.description && (
                        <p className="mt-1 typo-caption text-slate-500 dark:text-slate-400">
                          {category.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-center typo-body-sm text-slate-500 dark:border-ep-border-card dark:text-slate-400">
                  {normalizedCategorySearch
                    ? 'No matching categories found.'
                    : canAddMoreCategories
                      ? 'All available categories are already selected.'
                      : t('vault.policies.emptyCategories.limitReached')}
                </p>
              )}

              {canCreateCustomCategory && (
                <button
                  type="button"
                  onClick={() => void handleCreateCategory()}
                  disabled={isCreatingCustomCategory}
                  className={cn(
                    'w-full rounded-lg border border-ep-primary-soft bg-ep-primary-softer/80 px-3 py-2 text-left transition disabled:opacity-60 disabled:cursor-not-allowed dark:border-ep-primary/40 dark:bg-ep-primary/10',
                    isCategoryQuotaExhausted
                      ? 'opacity-60'
                      : 'hover:border-ep-primary-muted hover:bg-ep-primary-softer dark:hover:border-ep-primary/60 dark:hover:bg-ep-primary/20',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="typo-body-sm-emphasis text-ep-primary-accent dark:text-ep-primary-soft">
                      Create "{categorySearch.trim()}"
                    </span>
                    {isCreatingCustomCategory && <Loader2 className="h-3.5 w-3.5 animate-spin text-ep-primary dark:text-ep-primary-muted" />}
                  </div>
                  <p className="mt-1 typo-caption text-ep-primary dark:text-ep-primary-muted">
                    Adds a new category with 3 default columns.
                  </p>
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleAddOtherCategory()}
                disabled={isCreatingCustomCategory || isSavingCategories}
                className={cn(
                  'w-full rounded-lg border border-ep-primary-soft bg-ep-primary-softer/80 px-3 py-2 text-left transition disabled:opacity-60 disabled:cursor-not-allowed dark:border-ep-primary/40 dark:bg-ep-primary/10',
                  isCategoryQuotaExhausted
                    ? 'opacity-60'
                    : 'hover:border-ep-primary-muted hover:bg-ep-primary-softer dark:hover:border-ep-primary/60 dark:hover:bg-ep-primary/20',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="typo-body-sm-emphasis text-ep-primary-accent dark:text-ep-primary-soft">
                    {t('vault.policies.otherCategory.label')}
                  </span>
                  {isCreatingCustomCategory && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-ep-primary dark:text-ep-primary-muted" />
                  )}
                </div>
                <p className="mt-1 typo-caption text-ep-primary dark:text-ep-primary-muted">
                  {t('vault.policies.otherCategory.description')}
                </p>
              </button>
            </div>
          </Card>
        </ModalOverlay>
      )}
      <VaultPoliciesRemoveCategoryDialog
        isOpen={categoryPendingRemoval != null}
        categoryName={categoryPendingRemoval?.name ?? null}
        isCustom={
          categories.find((entry) => entry.id === categoryPendingRemoval?.id)?.source === 'custom'
        }
        isRemoving={isSavingCategories || isDeletingCustomCategory}
        onClose={closeRemoveCategoryDialog}
        onConfirm={() => void confirmRemoveCategory()}
      />
      <VaultPoliciesDeleteColumnDialog
        isOpen={columnPendingDeletion != null}
        columnLabel={columnPendingDeletion?.fieldLabel ?? null}
        categoryName={columnPendingDeletion?.categoryName ?? null}
        isDeleting={isDeletingCustomField}
        onClose={closeDeleteColumnDialog}
        onConfirm={() => void confirmDeleteColumn()}
      />
      <VaultPoliciesDeleteRowDialog
        isOpen={rowPendingDeletion != null}
        categoryName={rowPendingDeletion?.categoryName ?? null}
        rowNumber={rowPendingDeletion?.rowNumber ?? null}
        onClose={closeDeleteRowDialog}
        onConfirm={confirmDeleteRow}
      />
      <VaultPoliciesDuplicateColumnDialog
        isOpen={duplicateColumnPending != null}
        columnLabel={
          duplicateColumnPending
            ? defaultCustomColumnLabel(duplicateColumnPending.draft.fieldType)
            : null
        }
        categoryName={
          duplicateColumnPending
            ? (categories.find((c) => c.id === duplicateColumnPending.categoryId)?.name ?? null)
            : null
        }
        isAdding={isAddingCustomField}
        onClose={() => setDuplicateColumnPending(null)}
        onConfirm={() => {
          if (!duplicateColumnPending) return
          const { categoryId, draft } = duplicateColumnPending
          setDuplicateColumnPending(null)
          void submitCustomField(categoryId, draft, true)
        }}
      />
    </div>
  )
}
