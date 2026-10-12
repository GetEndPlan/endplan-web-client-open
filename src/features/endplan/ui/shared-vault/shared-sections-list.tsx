import type { TFunction } from 'i18next'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/shared/ui'
import type { VaultSectionResponse } from '@/features/endplan/api/clients/vault-api'
import { SECTION_ID } from '../../model/vault-section-types'

type SectionContent = {
    items?: Record<string, unknown>[]
    categories?: Array<{ rows?: Array<{ values?: Record<string, unknown> }> }>
}
type DecryptedSection = { section: VaultSectionResponse; content: SectionContent | null }

type SharedSectionsListProps = {
    sections: DecryptedSection[]
    loading: boolean
    error: string | null
    onSectionClick: (section: DecryptedSection) => void
    t: TFunction
}

export function SharedSectionsList({
    sections,
    loading,
    error,
    onSectionClick,
    t,
}: SharedSectionsListProps) {
    const getSectionCount = (section: DecryptedSection): number => {
        if (!section.content) return 0
        if (
            (section.section.sectionType === SECTION_ID.ASSETS ||
                section.section.sectionType === SECTION_ID.POLICIES) &&
            Array.isArray(section.content.categories)
        ) {
            return section.content.categories.reduce((sum, category) => sum + (category.rows?.length ?? 0), 0)
        }
        return Array.isArray(section.content.items) ? section.content.items.length : 0
    }

    return (
        <Card className="mt-6">
            <Card.Header
                title={t('sharedVault.sectionsTitle', 'Sections shared with you')}
                subtitle={
                    loading
                        ? t('sharedVault.sectionsLoading', 'Loading sections...')
                        : t('sharedVault.sectionsSubtitle', 'These are the vault sections you have access to.')
                }
            />
            <Card.Body>
                {error && (
                    <p className="typo-body-sm text-amber-600 dark:text-amber-400 mb-4">{error}</p>
                )}
                {!loading && sections.length === 0 && !error && (
                    <p className="text-gray-500 italic">
                        {t('sharedVault.noSections', 'No sections have been shared with you yet.')}
                    </p>
                )}
                {!loading && sections.length > 0 && (
                    <div className="space-y-4">
                        {sections.map((decrypted) => (
                            <button
                                key={decrypted.section.id}
                                type="button"
                                onClick={() => onSectionClick(decrypted)}
                                className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-ep-primary-muted dark:hover:border-ep-primary transition-colors flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h3 className="typo-emphasis text-gray-900 dark:text-gray-100 capitalize">
                                        {t(`nav.${decrypted.section.sectionType}`) || decrypted.section.sectionName}
                                    </h3>
                                    <p className="typo-caption text-gray-500 dark:text-gray-400 mt-0.5">{decrypted.section.sectionName}</p>
                                    {decrypted.section.sectionType === SECTION_ID.DOCUMENTS ? (
                                        <p className="typo-body-sm text-gray-600 dark:text-gray-300 mt-2">
                                            {t('sharedVault.openDocumentsHint', 'Open to view shared documents.')}
                                        </p>
                                    ) : decrypted.content && getSectionCount(decrypted) > 0 ? (
                                        <p className="typo-body-sm text-gray-600 dark:text-gray-300 mt-2">
                                            {getSectionCount(decrypted)} {getSectionCount(decrypted) === 1 ? 'item' : 'items'}
                                        </p>
                                    ) : decrypted.content ? (
                                        <p className="typo-body-sm text-gray-500 italic mt-2">
                                            {t('sharedVault.emptySection', 'No items in this section.')}
                                        </p>
                                    ) : (
                                        <p className="typo-body-sm text-amber-600 dark:text-amber-400 mt-2">
                                            {t('sharedVault.decryptFailed', 'Could not decrypt this section.')}
                                        </p>
                                    )}
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>
    )
}
