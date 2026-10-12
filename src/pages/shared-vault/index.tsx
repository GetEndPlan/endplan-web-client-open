import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES, sharedEndplanPath, sharedEndplanSectionPath } from '@/app/constants/routes'
import {
  getSharedVaultDisplayName,
  useSharedVaultPage,
  SharedVaultKeyPersonSectionsBlocked,
  SharedVaultSectionReadOnly,
  SharedSectionsList,
  SharedVaultLoadingState,
  SharedVaultErrorState,
  SharedVaultNotFoundState,
  SharedVaultPendingTransferState,
  SECTION_CONFIG,
  SharedVaultInactivityReleaseBanner,
  isVisibleVaultSectionType,
  type SectionType,
} from '@/features/endplan'
import { cn } from '@/shared/lib'
import { Card, PageHeader, PageTitle } from '@/shared/ui'

const KNOWN_SECTION_TYPES = new Set<SectionType>(['assets', 'documents', 'instructions'])

export function SharedVaultPage() {
  const { t } = useTranslation()
  const { id, sectionType } = useParams<{ id: string; sectionType?: string }>()
  const navigate = useNavigate()

  const {
    selectedSharedVault,
    decryptFlowEnabled,
    isLoading,
    error,
    showOwnerInactiveBanner,
    sharedSections,
    sectionsLoadingOrDecrypting,
    sectionsError,
  } = useSharedVaultPage({
    id,
  })

  useEffect(() => {
    if (!id || !selectedSharedVault || selectedSharedVault.id !== id) return
    if (sectionType && !isVisibleVaultSectionType(sectionType)) {
      navigate(sharedEndplanPath(id), { replace: true })
      return
    }
    if (decryptFlowEnabled || !sectionType) return
    navigate(sharedEndplanPath(id), { replace: true })
  }, [decryptFlowEnabled, id, navigate, sectionType, selectedSharedVault])

  const orderedSections = useMemo(
    () => [...sharedSections].sort((a, b) => a.section.displayOrder - b.section.displayOrder),
    [sharedSections],
  )
  const activeSection =
    orderedSections.find((section) => section.section.sectionType === sectionType) ?? null
  const activeSectionType = activeSection?.section.sectionType ?? null
  const activeSectionConfig =
    activeSectionType && KNOWN_SECTION_TYPES.has(activeSectionType as SectionType)
      ? SECTION_CONFIG[activeSectionType as SectionType]
      : null

  if (isLoading) {
    return <SharedVaultLoadingState />
  }

  if (error) {
    return <SharedVaultErrorState message={error} onBack={() => navigate(ROUTES.SHARED_WITH_ME)} />
  }

  if (!selectedSharedVault) {
    return <SharedVaultNotFoundState onBack={() => navigate(ROUTES.SHARED_WITH_ME)} />
  }

  const sharedVaultDisplayName = getSharedVaultDisplayName(selectedSharedVault, t)

  const isSectionDetailsView = decryptFlowEnabled && !!sectionType
  const isDocumentsSectionDetailsView = isSectionDetailsView && activeSectionType === 'documents'
  const ownerInactivityDays = selectedSharedVault.inactivityPeriodDays
  const sectionTitle =
    activeSectionType && KNOWN_SECTION_TYPES.has(activeSectionType as SectionType)
      ? t(`nav.${activeSectionType}`)
      : activeSection?.section.sectionName ?? t('sharedVault.sectionsTitle', 'Sections shared with you')

  return (
    <div
      className={cn(
        isDocumentsSectionDetailsView ? 'space-y-3' : 'space-y-6',
        isDocumentsSectionDetailsView && 'xl:flex xl:min-h-0 xl:flex-1 xl:flex-col',
      )}
    >
      {isSectionDetailsView ? (
        <div className="flex items-start gap-4">
          <span className="typo-symbol-display">{activeSectionConfig?.icon ?? '🔒'}</span>
          <div className="space-y-2">
            <PageTitle>{sectionTitle}</PageTitle>
            <p className="typo-body-sm text-slate-500 dark:text-slate-400">
              {t('dashboard.sharedWithMe.from', { name: selectedSharedVault.ownerName })} · {sharedVaultDisplayName}
            </p>
          </div>
        </div>
      ) : (
        <PageHeader
          title={sharedVaultDisplayName}
          description={t('dashboard.sharedWithMe.from', { name: selectedSharedVault.ownerName })}
          descriptionClassName="text-slate-500 dark:text-slate-400"
        />
      )}

      {sectionsError && decryptFlowEnabled ? (
        <Card className="p-4">
          <p className="typo-body-sm text-amber-600 dark:text-amber-400">{sectionsError}</p>
        </Card>
      ) : null}

      {!decryptFlowEnabled ? (
        selectedSharedVault.role === 'key_person' ? (
          <SharedVaultKeyPersonSectionsBlocked
            ownerName={selectedSharedVault.ownerName}
            sectionsHiddenReason={selectedSharedVault.sectionsHiddenReason}
          />
        ) : (
          <SharedVaultPendingTransferState ownerName={selectedSharedVault.ownerName} />
        )
      ) : sectionsLoadingOrDecrypting ? (
        <Card className="p-5">
          <p className="typo-body-sm text-slate-500 dark:text-slate-400">
            {t('sharedVault.sectionsLoading', 'Loading sections...')}
          </p>
        </Card>
      ) : orderedSections.length === 0 ? (
        <Card className="p-5">
          <p className="typo-body-sm text-slate-500 dark:text-slate-400 italic">
            {t('sharedVault.noSections', 'No sections have been shared with you yet.')}
          </p>
        </Card>
      ) : !isSectionDetailsView ? (
        <div className="space-y-4">
          {showOwnerInactiveBanner && ownerInactivityDays != null && (
            <SharedVaultInactivityReleaseBanner
              ownerName={selectedSharedVault.ownerName}
              inactivityDays={ownerInactivityDays}
            />
          )}
          <SharedSectionsList
            sections={orderedSections}
            loading={false}
            error={null}
            onSectionClick={(section) =>
              navigate(sharedEndplanSectionPath(selectedSharedVault.id, section.section.sectionType))
            }
            t={t}
          />
        </div>
      ) : activeSection ? (
        <div className={cn(isDocumentsSectionDetailsView && 'xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col')}>
          <SharedVaultSectionReadOnly
            section={activeSection}
            vaultId={selectedSharedVault.id}
            t={t}
          />
        </div>
      ) : (
        <Card className="p-5">
          <p className="typo-body-sm text-slate-500 dark:text-slate-400 italic">
            {t('sharedVault.noSections', 'No sections have been shared with you yet.')}
          </p>
        </Card>
      )}
    </div>
  )
}
