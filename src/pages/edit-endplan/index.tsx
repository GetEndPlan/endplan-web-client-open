import {
  EndPlanForm,
  EditEndPlanHeader,
  EditEndPlanLoadingState,
  EditEndPlanSecurityNote,
  useEditEndPlanPage,
} from '@/features/endplan'
import {
  EncryptionKeysRequired
} from '@/features/keys'
import {
  SimulateReleaseCard,
} from '@/features/trusted-circle'

export function EditEndPlanPage() {
  const {
    data,
    name,
    description,
    content,
    hasUnsavedChanges,
    displayError,
    isSaving,
    isVaultDataLoading,
    hasRequiredKeys,
    pendingReleaseInvitations,
    isReleasing,
    refetchPending,
    handleNameChange,
    handleDescriptionChange,
    handleContentChange,
    handleSave,
    handleBack,
    handleReleaseAll,
  } = useEditEndPlanPage()

  // Show loading while decrypting
  if (isVaultDataLoading && !data) {
    return <EditEndPlanLoadingState />
  }

  // Show error if no keys
  if (!hasRequiredKeys) {
    return <EncryptionKeysRequired />
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <EditEndPlanHeader hasUnsavedChanges={hasUnsavedChanges} onBack={handleBack} />

        <EndPlanForm
          translationPrefix="endplan.edit"
          name={name}
          description={description}
          content={content}
          onNameChange={handleNameChange}
          onDescriptionChange={handleDescriptionChange}
          onContentChange={handleContentChange}
          isSaving={isSaving}
          error={displayError}
          onSubmit={handleSave}
          onCancel={handleBack}
        />

        <EditEndPlanSecurityNote />

        {/* Simulate Release Section - Send invites to recipients */}
        <SimulateReleaseCard
          pendingReleaseInvitations={pendingReleaseInvitations}
          isReleasing={isReleasing}
          onRelease={handleReleaseAll}
          onReload={() => refetchPending()}
        />
      </div>
    </div>
  )
}
