import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import {
  CONTACT_ROLES,
  contactInitials,
  type ContactItem,
  type ContactRole,
  type ContactRoleFilter,
} from '../../model/contacts'
import { ContactRoleBadge } from './contact-role-visuals'
import { ContactsRoleSuggestions } from './contacts-role-suggestions'
import { useContactRoleLabels } from './use-contact-role-labels'

type ContactsListPanelProps = {
  contacts: ContactItem[]
  filteredContacts: ContactItem[]
  selectedContactId: string | null
  searchQuery: string
  roleFilter: ContactRoleFilter
  /** When false, the "People to consider" quick-add section is hidden. */
  showRoleSuggestions: boolean
  onSelect: (contactId: string) => void
  onSearchChange: (value: string) => void
  onRoleFilterChange: (value: ContactRoleFilter) => void
  onAddRole: (role: ContactRole) => void
}

export function ContactsListPanel({
  contacts,
  filteredContacts,
  selectedContactId,
  searchQuery,
  roleFilter,
  showRoleSuggestions,
  onSelect,
  onSearchChange,
  onRoleFilterChange,
  onAddRole,
}: ContactsListPanelProps) {
  const { t } = useTranslation()
  const roleLabels = useContactRoleLabels()

  const addedRoles = useMemo(
    () => new Set<ContactRole>(contacts.map((contact) => contact.role)),
    [contacts],
  )

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('vault.contacts.searchPlaceholder')}
            aria-label={t('vault.contacts.searchPlaceholder')}
            className="ep-input-field pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value as ContactRoleFilter)}
          aria-label={t('vault.contacts.filterByRole')}
          className="ep-input-field sm:w-36"
        >
          <option value="all">{t('vault.contacts.allRoles')}</option>
          {CONTACT_ROLES.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role]}
            </option>
          ))}
        </select>
      </div>

      {showRoleSuggestions ? (
        <div className="space-y-2 border-b border-ep-border-subtle pb-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="typo-body-sm-strong text-ep-body dark:text-white">
              {t('vault.contacts.consider.title')}
            </h4>
            <span className="rounded-full bg-ep-primary-softer px-2 py-0.5 typo-caption-strong text-ep-primary dark:bg-ep-primary/15">
              {t('vault.contacts.consider.added')}
            </span>
          </div>
          <p className="typo-caption text-slate-500 dark:text-slate-400">
            {t('vault.contacts.consider.subtitle')}
          </p>
          <ContactsRoleSuggestions variant="chip" addedRoles={addedRoles} onAddRole={onAddRole} />
        </div>
      ) : null}

      {filteredContacts.length === 0 ? (
        <p className="rounded-ep-panel border border-dashed border-ep-border-subtle px-4 py-6 text-center typo-body-sm text-slate-500 dark:text-slate-400">
          {contacts.length === 0
            ? t('vault.contacts.list.empty')
            : t('vault.contacts.list.noMatches')}
        </p>
      ) : (
        <ul className="-mx-4 flex min-h-0 flex-col overflow-y-auto">
          {filteredContacts.map((contact) => {
            const isSelected = contact.id === selectedContactId
            return (
              <li key={contact.id}>
                <button
                  type="button"
                  onClick={() => onSelect(contact.id)}
                  aria-current={isSelected}
                  className={cn(
                    'flex w-full items-center gap-3 border-l-4 px-4 py-2.5 text-left transition',
                    isSelected
                      ? 'border-l-ep-primary bg-ep-primary-softer dark:bg-ep-primary/10'
                      : 'border-l-transparent hover:bg-ep-surface-subtle',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ep-primary-softer typo-caption-strong text-ep-primary dark:bg-ep-primary/15">
                    {contactInitials(contact.fullName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate typo-body-sm-strong text-ep-body dark:text-white">
                      {contact.fullName}
                    </span>
                    <span className="mt-1 flex min-w-0 items-center gap-2">
                      <ContactRoleBadge contact={contact} roleLabels={roleLabels} />
                      {contact.email.trim() ? (
                        <span className="truncate typo-caption text-slate-500 dark:text-slate-400">
                          {contact.email}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
