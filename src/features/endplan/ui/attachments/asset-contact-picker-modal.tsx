import { useMemo, useState } from 'react'
import { Search, User, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { ModalOverlay } from '@/shared/ui'
import type { AssetContactOption } from '../../model/asset-contact-ref'

type AssetContactPickerModalProps = {
  title: string
  contacts: AssetContactOption[]
  selectedContactId?: string | null
  onClose: () => void
  onSelect: (contact: AssetContactOption) => void
}

export function AssetContactPickerModal({
  title,
  contacts,
  selectedContactId = null,
  onClose,
  onSelect,
}: AssetContactPickerModalProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const filteredContacts = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return contacts
    return contacts.filter(
      (contact) =>
        contact.label.toLowerCase().includes(normalized) ||
        contact.subtitle.toLowerCase().includes(normalized),
    )
  }, [contacts, search])

  return (
    <ModalOverlay onBackdropClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-ep-border-card dark:bg-ep-surface">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-5 py-4 dark:border-ep-border-card dark:bg-ep-surface-subtle">
          <h3 className="typo-heading-subcard text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/50 dark:hover:text-slate-100"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-ep-border-card dark:bg-ep-surface-subtle">
            <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder={t('vault.assets.contacts.searchPlaceholder')}
              className="h-8 w-full border-0 bg-transparent p-0 typo-body text-slate-700 outline-none placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
              autoFocus
            />
          </div>
          <div className="max-h-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 dark:border-ep-border-card dark:bg-ep-surface-subtle">
            {filteredContacts.length > 0 ? (
              <div className="space-y-1">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContactId === contact.id
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => onSelect(contact)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition',
                        isSelected
                          ? 'bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary/20 dark:text-ep-primary-muted'
                          : 'hover:bg-slate-100 dark:hover:bg-ep-primary-dark/40',
                      )}
                    >
                      <User
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isSelected
                            ? 'text-ep-primary dark:text-ep-primary-muted'
                            : 'text-slate-500 dark:text-slate-400',
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate typo-body-sm-strong',
                            isSelected ? undefined : 'text-slate-900 dark:text-slate-100',
                          )}
                        >
                          {contact.label}
                        </p>
                        <p
                          className={cn(
                            'truncate typo-caption',
                            isSelected
                              ? 'text-ep-primary/80 dark:text-ep-primary-muted/80'
                              : 'text-slate-500 dark:text-slate-400',
                          )}
                        >
                          {contact.subtitle || t('vault.assets.contacts.noSubtitle')}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="px-2 py-6 text-center typo-body-sm text-slate-500 dark:text-slate-400">
                {contacts.length === 0
                  ? t('vault.assets.contacts.emptyList')
                  : t('vault.assets.contacts.searchNoResults')}
              </p>
            )}
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}
