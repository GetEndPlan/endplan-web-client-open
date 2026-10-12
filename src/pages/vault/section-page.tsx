import { useNavigate, useParams, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  INSTRUCTION_NEW_ID,
  ROUTES,
  endplanInstructionEditPath,
  endplanInstructionNewEditPath,
  endplanInstructionNewPath,
  endplanInstructionPreviewPath,
  endplanSectionPath,
} from '@/app/constants/routes'
import { useSubscription } from '@/features/billing'
import {
  SECTION_ID,
  useVaultContactsPage,
  useVaultInstructionsPage,
  useVaultAssetsPage,
  useVaultPoliciesPage,
  useVaultDocumentsPage,
  VaultAssetsReadOnlyTable,
  VaultAssetsSuggestionsPanel,
  VaultAssetsTable,
  VaultPoliciesReadOnlyTable,
  VaultPoliciesSuggestionsPanel,
  VaultPoliciesTable,
  VaultContactsPage,
  DocumentsUploadProgressToast,
  VaultDocumentsManager,
  VaultInstructionsPage,
  VaultSectionLoadingState,
  VaultSectionNoVaultState,
} from '@/features/endplan'
import { useKeyPersonPageGate } from '@/features/trusted-circle/hooks/use-key-person-page-gate'
import { KeyPersonStartOwnEndplanGateModal } from '@/features/trusted-circle/ui/key-person/key-person-start-own-endplan-gate-modal'
import { PageHeader, InlineAlert, Button } from '@/shared/ui'
import type { InstructionType } from '@/features/endplan/model/instructions'

type NewInstructionLocationState = {
  instructionType?: InstructionType
  title?: string
  noteBody?: string
}

function VaultAssetsSectionPage({ keyPersonInteractionLocked = false }: { keyPersonInteractionLocked?: boolean }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: subscriptionResponse } = useSubscription()
  const {
    vault,
    categories,
    selectedCategoryIds,
    setSelectedCategoryIds,
    assetCategoriesMax,
    assetRowsPerCategoryMax,
    isLoading,
    canPersistAssets,
    hydrationStatus,
    hydrationErrorKey,
    retryAssetsHydration,
    isSavingCategories,
    isSavingAssets,
    isAddingCustomField,
    isDeletingCustomField,
    isDeletingCustomCategory,
    isCreatingCustomCategory,
    isUpdatingCustomCategory,
    isUpdatingField,
    isAttachmentsLoading,
    autosaveStatus,
    lastSavedAt,
    saveApiCallCount,
    isOffline,
    attachmentsById,
    documentsFolders,
    documentsFiles,
    documentsFilesById,
    attachmentFieldKeysByCategory,
    passwordFieldKeysByCategory,
    contactFieldKeysByCategory,
    activeAttachmentCellKey,
    getRows,
    addRow,
    removeRow,
    setCellValue,
    setEditorActive,
    persistSelectedCategories,
    createCustomCategory,
    addCustomField,
    renameField,
    renameCustomCategory,
    deleteCustomCategory,
    deleteCustomField,
    uploadAttachment,
    downloadAttachment,
    downloadLinkedDocument,
    viewLinkedDocument,
    viewAttachment,
    documentViewer,
    linkDocument,
    clearAttachment,
    contactOptions,
    contactsById,
    linkContact,
    clearContact,
    canManageDocuments,
    createDocumentsFolder,
    uploadDocumentToFolder,
    isVaultDocumentsActionBusy,
  } = useVaultAssetsPage()
  const isReadOnlyMode = subscriptionResponse?.canAccess === false || keyPersonInteractionLocked

  if (isLoading) {
    return <VaultSectionLoadingState />
  }

  if (!vault) {
    return (
      <VaultSectionNoVaultState
        backLabel={t('common.back')}
        onBack={() => navigate(ROUTES.DASHBOARD)}
        bodyText={t('vault.sectionPage.noVaultBody')}
        ctaLabel={t('vault.sectionPage.noVaultCta')}
        onCta={() => navigate(ROUTES.DASHBOARD)}
      />
    )
  }

  if (hydrationStatus === 'error' && hydrationErrorKey) {
    return (
      <div className="space-y-6 overflow-x-hidden">
        <PageHeader
          title={t('nav.assets')}
          description={t('vault.sectionPage.assetsSubtitle')}
          descriptionClassName="text-slate-500 dark:text-slate-400"
        />
        <InlineAlert variant="error">{t(hydrationErrorKey)}</InlineAlert>
        <Button type="button" variant="secondary" onClick={retryAssetsHydration}>
          {t('vault.assets.hydration.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {isReadOnlyMode ? (
        <>
          <PageHeader
            title={t('nav.assets')}
            description={t('vault.sectionPage.assetsSubtitle')}
            descriptionClassName="text-slate-500 dark:text-slate-400"
          />
          <div className="space-y-5">
            <VaultAssetsSuggestionsPanel
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              interactive={false}
            />
            <VaultAssetsReadOnlyTable
              categories={categories
                .filter((category) => selectedCategoryIds.includes(category.id))
                .map((category) => ({
                  id: category.id,
                  key: category.id,
                  name: category.name,
                  rows: getRows(category.id),
                }))}
              emptyStateMessage={t('vault.assets.readOnlyEmptyState')}
              emptyCategoryMessage={t('vault.assets.readOnlyEmptyCategory')}
              getRowCountLabel={(count) => t('vault.assets.readOnlyRowCount', { count })}
              attachmentFieldKeysByCategory={attachmentFieldKeysByCategory}
              passwordFieldKeysByCategory={passwordFieldKeysByCategory}
              contactFieldKeysByCategory={contactFieldKeysByCategory}
              contactsById={contactsById}
              attachmentsById={attachmentsById}
              linkedDocumentsById={documentsFilesById}
              onDownloadAttachment={(attachment) => void downloadAttachment(attachment)}
              onDownloadLinkedDocument={(document) => void downloadLinkedDocument(document)}
              onViewLinkedDocument={viewLinkedDocument}
              onViewAttachment={viewAttachment}
              documentViewer={documentViewer}
            />
          </div>
        </>
      ) : (
        <VaultAssetsTable
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          setSelectedCategoryIds={setSelectedCategoryIds}
          canPersistAssets={canPersistAssets}
          assetCategoriesMax={assetCategoriesMax}
          assetRowsPerCategoryMax={assetRowsPerCategoryMax}
          isSavingCategories={isSavingCategories}
          isSavingAssets={isSavingAssets}
          isAddingCustomField={isAddingCustomField}
          isDeletingCustomField={isDeletingCustomField}
          isDeletingCustomCategory={isDeletingCustomCategory}
          isCreatingCustomCategory={isCreatingCustomCategory}
          isUpdatingCustomCategory={isUpdatingCustomCategory}
          isUpdatingField={isUpdatingField}
          isAttachmentsLoading={isAttachmentsLoading}
          autosaveStatus={autosaveStatus}
          lastSavedAt={lastSavedAt}
          saveApiCallCount={saveApiCallCount}
          isOffline={isOffline}
          attachmentsById={attachmentsById}
          documentsFolders={documentsFolders}
          documentsFiles={documentsFiles}
          documentsFilesById={documentsFilesById}
          activeAttachmentCellKey={activeAttachmentCellKey}
          getRows={getRows}
          setCellValue={setCellValue}
          onEditorActivityChange={setEditorActive}
          addRow={addRow}
          removeRow={removeRow}
          onPersistSelectedCategories={persistSelectedCategories}
          onCreateCustomCategory={createCustomCategory}
          onAddCustomField={addCustomField}
          onRenameField={renameField}
          onRenameCustomCategory={renameCustomCategory}
          onDeleteCustomCategory={deleteCustomCategory}
          onDeleteCustomField={deleteCustomField}
          onUploadAttachment={uploadAttachment}
          onDownloadAttachment={downloadAttachment}
          onDownloadLinkedDocument={downloadLinkedDocument}
          onViewLinkedDocument={viewLinkedDocument}
          onViewAttachment={viewAttachment}
          documentViewer={documentViewer}
          onLinkDocument={linkDocument}
          onClearAttachment={clearAttachment}
          contactOptions={contactOptions}
          contactsById={contactsById}
          onLinkContact={linkContact}
          onClearContact={clearContact}
          canManageDocuments={canManageDocuments}
          onCreateDocumentsFolder={createDocumentsFolder}
          onUploadDocumentToFolder={uploadDocumentToFolder}
          isVaultDocumentsActionBusy={isVaultDocumentsActionBusy}
        />
      )}
    </div>
  )
}

function VaultPoliciesSectionPage({ keyPersonInteractionLocked = false }: { keyPersonInteractionLocked?: boolean }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: subscriptionResponse } = useSubscription()
  const {
    vault,
    categories,
    selectedCategoryIds,
    setSelectedCategoryIds,
    policyCategoriesMax,
    assetRowsPerCategoryMax,
    isLoading,
    canPersistAssets,
    hydrationStatus,
    hydrationErrorKey,
    retryAssetsHydration,
    isSavingCategories,
    isSavingAssets,
    isAddingCustomField,
    isDeletingCustomField,
    isDeletingCustomCategory,
    isCreatingCustomCategory,
    isUpdatingCustomCategory,
    isUpdatingField,
    isAttachmentsLoading,
    autosaveStatus,
    lastSavedAt,
    saveApiCallCount,
    isOffline,
    attachmentsById,
    documentsFolders,
    documentsFiles,
    documentsFilesById,
    attachmentFieldKeysByCategory,
    passwordFieldKeysByCategory,
    contactFieldKeysByCategory,
    activeAttachmentCellKey,
    getRows,
    addRow,
    removeRow,
    setCellValue,
    setEditorActive,
    persistSelectedCategories,
    createCustomCategory,
    addCustomField,
    renameField,
    renameCustomCategory,
    deleteCustomCategory,
    deleteCustomField,
    uploadAttachment,
    downloadAttachment,
    downloadLinkedDocument,
    viewLinkedDocument,
    viewAttachment,
    documentViewer,
    linkDocument,
    clearAttachment,
    contactOptions,
    contactsById,
    linkContact,
    clearContact,
    canManageDocuments,
    createDocumentsFolder,
    uploadDocumentToFolder,
    isVaultDocumentsActionBusy,
  } = useVaultPoliciesPage()
  const isReadOnlyMode = subscriptionResponse?.canAccess === false || keyPersonInteractionLocked

  if (isLoading) {
    return <VaultSectionLoadingState />
  }

  if (!vault) {
    return (
      <VaultSectionNoVaultState
        backLabel={t('common.back')}
        onBack={() => navigate(ROUTES.DASHBOARD)}
        bodyText={t('vault.sectionPage.noVaultBody')}
        ctaLabel={t('vault.sectionPage.noVaultCta')}
        onCta={() => navigate(ROUTES.DASHBOARD)}
      />
    )
  }

  if (hydrationStatus === 'error' && hydrationErrorKey) {
    return (
      <div className="space-y-6 overflow-x-hidden">
        <PageHeader
          title={t('nav.policies')}
          description={t('vault.sectionPage.policiesSubtitle')}
          descriptionClassName="text-slate-500 dark:text-slate-400"
        />
        <InlineAlert variant="error">{t(hydrationErrorKey)}</InlineAlert>
        <Button type="button" variant="secondary" onClick={retryAssetsHydration}>
          {t('vault.policies.hydration.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {isReadOnlyMode ? (
        <>
          <PageHeader
            title={t('nav.policies')}
            description={t('vault.sectionPage.policiesSubtitle')}
            descriptionClassName="text-slate-500 dark:text-slate-400"
          />
          <div className="space-y-5">
            <VaultPoliciesSuggestionsPanel
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              interactive={false}
            />
            <VaultPoliciesReadOnlyTable
              categories={categories
                .filter((category) => selectedCategoryIds.includes(category.id))
                .map((category) => ({
                  id: category.id,
                  key: category.id,
                  name: category.name,
                  rows: getRows(category.id),
                }))}
              emptyStateMessage={t('vault.policies.readOnlyEmptyState')}
              emptyCategoryMessage={t('vault.policies.readOnlyEmptyCategory')}
              getRowCountLabel={(count) => t('vault.policies.readOnlyRowCount', { count })}
              attachmentFieldKeysByCategory={attachmentFieldKeysByCategory}
              passwordFieldKeysByCategory={passwordFieldKeysByCategory}
              contactFieldKeysByCategory={contactFieldKeysByCategory}
              contactsById={contactsById}
              attachmentsById={attachmentsById}
              linkedDocumentsById={documentsFilesById}
              onDownloadAttachment={(attachment) => void downloadAttachment(attachment)}
              onDownloadLinkedDocument={(document) => void downloadLinkedDocument(document)}
              onViewLinkedDocument={viewLinkedDocument}
              onViewAttachment={viewAttachment}
              documentViewer={documentViewer}
            />
          </div>
        </>
      ) : (
        <VaultPoliciesTable
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          setSelectedCategoryIds={setSelectedCategoryIds}
          canPersistAssets={canPersistAssets}
          policyCategoriesMax={policyCategoriesMax}
          assetRowsPerCategoryMax={assetRowsPerCategoryMax}
          isSavingCategories={isSavingCategories}
          isSavingAssets={isSavingAssets}
          isAddingCustomField={isAddingCustomField}
          isDeletingCustomField={isDeletingCustomField}
          isDeletingCustomCategory={isDeletingCustomCategory}
          isCreatingCustomCategory={isCreatingCustomCategory}
          isUpdatingCustomCategory={isUpdatingCustomCategory}
          isUpdatingField={isUpdatingField}
          isAttachmentsLoading={isAttachmentsLoading}
          autosaveStatus={autosaveStatus}
          lastSavedAt={lastSavedAt}
          saveApiCallCount={saveApiCallCount}
          isOffline={isOffline}
          attachmentsById={attachmentsById}
          documentsFolders={documentsFolders}
          documentsFiles={documentsFiles}
          documentsFilesById={documentsFilesById}
          activeAttachmentCellKey={activeAttachmentCellKey}
          getRows={getRows}
          setCellValue={setCellValue}
          onEditorActivityChange={setEditorActive}
          addRow={addRow}
          removeRow={removeRow}
          onPersistSelectedCategories={persistSelectedCategories}
          onCreateCustomCategory={createCustomCategory}
          onAddCustomField={addCustomField}
          onRenameField={renameField}
          onRenameCustomCategory={renameCustomCategory}
          onDeleteCustomCategory={deleteCustomCategory}
          onDeleteCustomField={deleteCustomField}
          onUploadAttachment={uploadAttachment}
          onDownloadAttachment={downloadAttachment}
          onDownloadLinkedDocument={downloadLinkedDocument}
          onViewLinkedDocument={viewLinkedDocument}
          onViewAttachment={viewAttachment}
          documentViewer={documentViewer}
          onLinkDocument={linkDocument}
          onClearAttachment={clearAttachment}
          contactOptions={contactOptions}
          contactsById={contactsById}
          onLinkContact={linkContact}
          onClearContact={clearContact}
          canManageDocuments={canManageDocuments}
          onCreateDocumentsFolder={createDocumentsFolder}
          onUploadDocumentToFolder={uploadDocumentToFolder}
          isVaultDocumentsActionBusy={isVaultDocumentsActionBusy}
        />
      )}
    </div>
  )
}

function VaultDocumentsSectionPage({ keyPersonInteractionLocked = false }: { keyPersonInteractionLocked?: boolean }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: subscriptionResponse } = useSubscription()
  const {
    vault,
    isLoading,
    isDecrypting,
    isUploading,
    uploadProgress,
    dismissUploadProgress,
    isRefreshing,
    canWrite,
    files,
    foldersByParent,
    visibleFiles,
    selectedFolderId,
    selectedFolder,
    breadcrumbs,
    setSelectedFolderId,
    createFolder,
    renameFolder,
    renameFile,
    moveFilesToFolder,
    deleteFolder,
    uploadFiles,
    downloadFile,
    viewDocumentFile,
    deleteFile,
    documentViewer,
    isCreatingFolder,
    isRenamingFolder,
    isRenamingFile,
    isMovingFiles,
    isDeletingFolder,
    isDeletingFile,
    canCreateFolder,
    canUploadDocuments,
    documentPlanLimits,
  } = useVaultDocumentsPage()
  const isReadOnlyMode = subscriptionResponse?.canAccess === false || keyPersonInteractionLocked

  if (isLoading) {
    return <VaultSectionLoadingState />
  }

  if (!vault) {
    return (
      <VaultSectionNoVaultState
        backLabel={t('common.back')}
        onBack={() => navigate(ROUTES.DASHBOARD)}
        bodyText={t('vault.sectionPage.noVaultBody')}
        ctaLabel={t('vault.sectionPage.noVaultCta')}
        onCta={() => navigate(ROUTES.DASHBOARD)}
      />
    )
  }

  return (
    <div className="-mx-4 -mt-4 overflow-x-hidden sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-6 sm:px-8 lg:px-10 xl:h-full xl:px-10 2xl:px-10">
        <VaultDocumentsManager
          canWrite={canWrite && !isReadOnlyMode}
          canCreateFolder={canCreateFolder}
          canUploadDocuments={canUploadDocuments}
          isBusy={
            isDecrypting ||
            isUploading ||
            isRefreshing ||
            isCreatingFolder ||
            isRenamingFolder ||
            isRenamingFile ||
            isMovingFiles ||
            isDeletingFolder ||
            isDeletingFile
          }
          isUploading={isUploading}
          foldersByParent={foldersByParent}
          files={files}
          visibleFiles={visibleFiles}
          selectedFolderId={selectedFolderId}
          selectedFolder={selectedFolder}
          breadcrumbs={breadcrumbs}
          setSelectedFolderId={setSelectedFolderId}
          createFolder={createFolder}
          renameFolder={renameFolder}
          renameFile={renameFile}
          moveFilesToFolder={moveFilesToFolder}
          deleteFolder={deleteFolder}
          uploadFiles={uploadFiles}
          downloadFile={downloadFile}
          viewDocumentFile={viewDocumentFile}
          deleteFile={deleteFile}
          documentViewer={documentViewer}
          maxFileSizeBytes={documentPlanLimits.fileSizeMaxBytes}
        />
        <DocumentsUploadProgressToast progress={uploadProgress} onDismiss={dismissUploadProgress} />
      </div>
    </div>
  )
}

function VaultInstructionsSectionPage({ keyPersonInteractionLocked = false }: { keyPersonInteractionLocked?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { sectionType, instructionId, instructionAction } = useParams<{
    sectionType: string
    instructionId?: string
    instructionAction?: string
  }>()
  const { t } = useTranslation()
  const { data: subscriptionResponse } = useSubscription()
  const {
    vault,
    isOwner,
    isLoading,
    isSaving,
    instructions,
    canAddMoreInstructions,
    assetOptions,
    contactOptions,
    documentOptions,
    documentFolders,
    createDocumentFolder,
    uploadDocumentToFolder,
    viewDocumentFile,
    documentViewer,
    upsertInstruction,
    deleteInstruction,
  } =
    useVaultInstructionsPage()

  const isReadOnlyMode = subscriptionResponse?.canAccess === false || keyPersonInteractionLocked || !isOwner
  const isEditPath = location.pathname.endsWith('/edit')
  const createFlowLocationState =
    instructionId === INSTRUCTION_NEW_ID && isEditPath
      ? (location.state as NewInstructionLocationState | null)
      : null
  const createFlowInitialInstructionType: InstructionType | undefined =
    createFlowLocationState?.instructionType
  const createFlowInitialTitle = createFlowLocationState?.title
  const createFlowInitialNoteBody = createFlowLocationState?.noteBody

  const routeMode: 'list' | 'preview' | 'edit' | 'choose-type' | 'create' =
    instructionId == null
      ? 'list'
      : instructionId === INSTRUCTION_NEW_ID
        ? isEditPath
          ? 'create'
          : 'choose-type'
        : isEditPath || instructionAction === 'edit'
          ? 'edit'
          : 'preview'

  if (isLoading) {
    return <VaultSectionLoadingState />
  }

  if (!vault) {
    return (
      <VaultSectionNoVaultState
        backLabel={t('common.back')}
        onBack={() => navigate(ROUTES.DASHBOARD)}
        bodyText={t('vault.sectionPage.noVaultBody')}
        ctaLabel={t('vault.sectionPage.noVaultCta')}
        onCta={() => navigate(ROUTES.DASHBOARD)}
      />
    )
  }

  if (sectionType !== SECTION_ID.INSTRUCTIONS) {
    return <Navigate to={endplanSectionPath(SECTION_ID.INSTRUCTIONS)} replace />
  }

  if (isReadOnlyMode && instructionId === INSTRUCTION_NEW_ID) {
    return <Navigate to={endplanSectionPath(SECTION_ID.INSTRUCTIONS)} replace />
  }

  if (instructionId === INSTRUCTION_NEW_ID && !canAddMoreInstructions) {
    return <Navigate to={endplanSectionPath(SECTION_ID.INSTRUCTIONS)} replace />
  }

  if (
    instructionId &&
    instructionId !== INSTRUCTION_NEW_ID &&
    !instructions.some((instruction) => instruction.id === instructionId)
  ) {
    return <Navigate to={endplanSectionPath(SECTION_ID.INSTRUCTIONS)} replace />
  }

  if (instructionAction && instructionAction !== 'edit') {
    return <Navigate to={endplanSectionPath(SECTION_ID.INSTRUCTIONS)} replace />
  }

  const isComposerMode = routeMode === 'create' || routeMode === 'edit'
  const isPreviewMode = routeMode === 'preview'

  return (
    <div
      className={
        isComposerMode || isPreviewMode
          ? '-mx-4 overflow-x-hidden sm:-mx-6 lg:-mx-8 lg:-mb-20'
          : '-mx-4 overflow-x-hidden sm:-mx-6 lg:-mx-8'
      }
    >
      <div className="px-6 sm:px-8 lg:px-10">
        <VaultInstructionsPage
          key={`${routeMode}:${instructionId ?? 'list'}:${createFlowInitialInstructionType ?? ''}:${createFlowInitialTitle ?? ''}`}
          instructions={instructions}
          canAddMoreInstructions={canAddMoreInstructions}
          assetOptions={assetOptions}
          contactOptions={contactOptions}
          documentOptions={documentOptions}
          documentFolders={documentFolders}
          isSaving={isSaving}
          isReadOnly={isReadOnlyMode}
          isDocumentsBusy={false}
          canManageDocuments={!isReadOnlyMode}
          onCreateDocumentFolder={createDocumentFolder}
          onUploadDocumentToFolder={uploadDocumentToFolder}
          onSave={upsertInstruction}
          onDelete={deleteInstruction}
          routeMode={routeMode}
          activeInstructionId={instructionId}
          createFlowInitialInstructionType={createFlowInitialInstructionType}
          createFlowInitialTitle={createFlowInitialTitle}
          createFlowInitialNoteBody={createFlowInitialNoteBody}
          onOpenNewInstruction={() => navigate(endplanInstructionNewPath())}
          onNavigateToInstructionComposer={(instructionType, draft) =>
            navigate(endplanInstructionNewEditPath(), {
              state: {
                instructionType,
                title: draft?.title,
                noteBody: draft?.noteBody,
              } satisfies NewInstructionLocationState,
            })
          }
          onBackFromInstructionComposer={() => navigate(endplanInstructionNewPath())}
          onOpenPreview={(id) => navigate(endplanInstructionPreviewPath(id))}
          onOpenEdit={(id) => navigate(endplanInstructionEditPath(id))}
          onBackToList={() => navigate(endplanSectionPath(SECTION_ID.INSTRUCTIONS))}
          onViewAsset={() => navigate(endplanSectionPath(SECTION_ID.ASSETS))}
          onViewContact={() => navigate(endplanSectionPath(SECTION_ID.CONTACTS))}
          onViewDocument={viewDocumentFile}
          documentViewer={documentViewer}
        />
      </div>
    </div>
  )
}

function VaultContactsSectionPage({ keyPersonInteractionLocked = false }: { keyPersonInteractionLocked?: boolean }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: subscriptionResponse } = useSubscription()
  const {
    vault,
    isOwner,
    isLoading,
    isSaving,
    contacts,
    filteredContacts,
    contactsMax,
    canAddMoreContacts,
    selectedContactId,
    setSelectedContactId,
    selectedContact,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    upsertContact,
    deleteContact,
  } = useVaultContactsPage()

  const isReadOnlyMode =
    subscriptionResponse?.canAccess === false || keyPersonInteractionLocked || !isOwner

  if (isLoading) {
    return <VaultSectionLoadingState />
  }

  if (!vault) {
    return (
      <VaultSectionNoVaultState
        backLabel={t('common.back')}
        onBack={() => navigate(ROUTES.DASHBOARD)}
        bodyText={t('vault.sectionPage.noVaultBody')}
        ctaLabel={t('vault.sectionPage.noVaultCta')}
        onCta={() => navigate(ROUTES.DASHBOARD)}
      />
    )
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <PageHeader
        title={t('nav.contacts')}
        description={t('vault.sectionPage.contactsSubtitle')}
        descriptionClassName="text-slate-500 dark:text-slate-400"
      />
      <VaultContactsPage
        contacts={contacts}
        filteredContacts={filteredContacts}
        contactsMax={contactsMax}
        canAddMoreContacts={canAddMoreContacts}
        selectedContactId={selectedContactId}
        selectedContact={selectedContact}
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        isSaving={isSaving}
        isReadOnly={isReadOnlyMode}
        onSelectContact={setSelectedContactId}
        onSearchChange={setSearchQuery}
        onRoleFilterChange={setRoleFilter}
        onSave={upsertContact}
        onDelete={deleteContact}
      />
    </div>
  )
}

export function VaultSectionPage() {
  const { sectionType } = useParams<{ sectionType: string }>()
  const gate = useKeyPersonPageGate()

  if (
    sectionType !== SECTION_ID.ASSETS &&
    sectionType !== SECTION_ID.POLICIES &&
    sectionType !== SECTION_ID.DOCUMENTS &&
    sectionType !== SECTION_ID.INSTRUCTIONS &&
    sectionType !== SECTION_ID.CONTACTS
  ) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <>
      {gate.requiresGate ? (
        <KeyPersonStartOwnEndplanGateModal
          isOpen={gate.showGateModal}
          onStartOwnEndplan={gate.onStartOwnEndplan}
          onContinueFree={gate.onContinueFree}
        />
      ) : null}
      {sectionType === SECTION_ID.ASSETS ? (
        <VaultAssetsSectionPage keyPersonInteractionLocked={gate.ctasSuppressed} />
      ) : sectionType === SECTION_ID.POLICIES ? (
        <VaultPoliciesSectionPage keyPersonInteractionLocked={gate.ctasSuppressed} />
      ) : sectionType === SECTION_ID.DOCUMENTS ? (
        <VaultDocumentsSectionPage keyPersonInteractionLocked={gate.ctasSuppressed} />
      ) : sectionType === SECTION_ID.CONTACTS ? (
        <VaultContactsSectionPage keyPersonInteractionLocked={gate.ctasSuppressed} />
      ) : (
        <VaultInstructionsSectionPage keyPersonInteractionLocked={gate.ctasSuppressed} />
      )}
    </>
  )
}
