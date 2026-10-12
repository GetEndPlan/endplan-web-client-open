import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EndPlanIcon, type EndPlanIconName } from '@/shared/ui'
import { endplanSectionPath } from '@/app/constants/routes'
import type { VaultResponse } from '../../api/clients/vault-api'
import { useVaultSectionItemCounts } from '../../hooks/dashboard/use-vault-section-item-counts'
import { SECTION_ID } from '../../model/vault-section-types'

const vaultSections: ReadonlyArray<{
  id: (typeof SECTION_ID)[keyof typeof SECTION_ID]
  icon: EndPlanIconName
  labelKey: 'assets' | 'policies' | 'instructions' | 'documents' | 'contacts'
}> = [
  { id: SECTION_ID.ASSETS, icon: 'assets', labelKey: 'assets' },
  { id: SECTION_ID.POLICIES, icon: 'security', labelKey: 'policies' },
  { id: SECTION_ID.INSTRUCTIONS, icon: 'security', labelKey: 'instructions' },
  { id: SECTION_ID.DOCUMENTS, icon: 'documents', labelKey: 'documents' },
  { id: SECTION_ID.CONTACTS, icon: 'key-person', labelKey: 'contacts' },
]

type VaultSectionGridProps = {
  vault: VaultResponse | null
}

export function VaultSectionGrid({ vault }: VaultSectionGridProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { counts, isReady } = useVaultSectionItemCounts(vault)

  return (
    <section
      data-tour="dashboard-vault-section-grid"
      aria-label={t('nav.vaultSections')}
      className="shrink-0 rounded-ep-card border border-ep-border-card bg-ep-surface p-4"
    >
      <h2 className="typo-heading-section text-ep-body dark:text-white">{t('nav.vaultSections')}</h2>
      <div className="mt-3 flex flex-col gap-2 lg:mt-2 lg:grid lg:grid-cols-2">
        {vaultSections.map((section) => {
          const count = counts[section.labelKey]
          const label = isReady
            ? `${t(`nav.${section.labelKey}`)} (${count})`
            : t(`nav.${section.labelKey}`)

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => navigate(endplanSectionPath(section.id))}
              className="flex min-h-[48px] w-full items-center gap-3 rounded-ep-panel border border-ep-border-subtle bg-ep-surface p-3 transition hover:border-ep-primary/30 hover:bg-ep-surface-subtle lg:min-h-[48px] lg:gap-2 lg:p-2.5"
            >
              <EndPlanIcon name={section.icon} size={24} className="size-5 shrink-0" />
              <span className="truncate typo-body-sm-strong text-ep-body dark:text-white">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
