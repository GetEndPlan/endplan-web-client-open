import { useTranslation } from 'react-i18next'

type KeyPersonForOwnerSidebarCardProps = {
  ownerDisplayName: string
  /** Desktop icon rail — no room for the card */
  isCollapsed: boolean
}

export function KeyPersonForOwnerSidebarCard({
  ownerDisplayName,
  isCollapsed,
}: KeyPersonForOwnerSidebarCardProps) {
  const { t } = useTranslation()

  if (isCollapsed) {
    return null
  }

  const name = ownerDisplayName.trim() || t('dashboard.keyPersonPrompt.someone')

  return (
    <div className="shrink-0 px-1 pt-1.5 pb-2.5">
      <section
        className="min-h-[66px] rounded-lg border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-600 dark:bg-ep-primary-dark/50"
        aria-label={`${t('dashboard.keyPersonPrompt.roleForOwnerKicker')}: ${name}`}
      >
        <p className="typo-caption-emphasis text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 whitespace-nowrap">
          {t('dashboard.keyPersonPrompt.roleForOwnerKicker')}
        </p>
        <p className="typo-body-sm-strong text-slate-800 dark:text-slate-100">{name}</p>
      </section>
    </div>
  )
}
