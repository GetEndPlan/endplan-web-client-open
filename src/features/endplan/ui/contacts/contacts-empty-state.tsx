import { useTranslation } from 'react-i18next'
import { Contact, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui'

type ContactsEmptyStateProps = {
  /** When false, hide the CTA (read-only). */
  showAdd: boolean
  /** When true, CTA stays clickable but looks muted (plan limit). */
  quotaExhausted?: boolean
  onAdd: () => void
}

/** Left column empty state: intro copy plus primary add CTA. Role suggestions live above the grid. */
export function ContactsEmptyState({
  showAdd,
  quotaExhausted = false,
  onAdd,
}: ContactsEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ep-primary-softer text-ep-primary dark:bg-ep-primary/15">
        <Contact className="h-8 w-8" strokeWidth={1.6} />
      </div>
      <div className="max-w-sm space-y-2">
        <h3 className="typo-heading-card text-ep-body dark:text-white">
          {t('vault.contacts.empty.title')}
        </h3>
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">
          {t('vault.contacts.empty.description')}
        </p>
      </div>
      {showAdd ? (
        <Button
          type="button"
          variant="primary"
          className={cn(quotaExhausted && 'opacity-60')}
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" />
          {t('vault.contacts.addContact')}
        </Button>
      ) : null}
    </div>
  )
}
