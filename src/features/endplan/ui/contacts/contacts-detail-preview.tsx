import { useTranslation } from 'react-i18next'
import { Contact, Mail, Phone, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const PREVIEW_ROWS: ReadonlyArray<{ key: string; labelKey: string; icon: LucideIcon }> = [
  { key: 'name', labelKey: 'vault.contacts.fields.name', icon: User },
  { key: 'role', labelKey: 'vault.contacts.fields.role', icon: Contact },
  { key: 'phone', labelKey: 'vault.contacts.fields.phone', icon: Phone },
  { key: 'email', labelKey: 'vault.contacts.fields.email', icon: Mail },
]

/** Placeholder shown in the detail column while no contact is selected (empty state). */
export function ContactsDetailPreview() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ep-primary-softer text-ep-primary dark:bg-ep-primary/15">
        <Contact className="h-8 w-8" strokeWidth={1.6} />
      </div>
      <div className="max-w-sm space-y-2">
        <h3 className="typo-heading-card text-ep-body dark:text-white">
          {t('vault.contacts.preview.title')}
        </h3>
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">
          {t('vault.contacts.preview.description')}
        </p>
      </div>

      <div
        aria-hidden
        className="w-full max-w-sm space-y-4 rounded-ep-panel border border-ep-border-subtle bg-ep-surface-subtle/50 p-4"
      >
        {PREVIEW_ROWS.map((row) => {
          const Icon = row.icon
          return (
            <div key={row.key} className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
              <span className="w-20 shrink-0 text-left typo-caption text-slate-400 dark:text-slate-500">
                {t(row.labelKey)}
              </span>
              <span className="h-2.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
