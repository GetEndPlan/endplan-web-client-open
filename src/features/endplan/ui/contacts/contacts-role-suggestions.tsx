import { useTranslation } from 'react-i18next'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { CONTACT_ROLE_SUGGESTIONS, type ContactRole } from '../../model/contacts'
import { ContactRoleIcon } from './contact-role-visuals'
import { useContactRoleLabels } from './use-contact-role-labels'

type ContactsRoleSuggestionsProps = {
  /** `card` shows role descriptions (empty state); `chip` is compact (list panel). */
  variant: 'card' | 'chip'
  /** Roles that already have at least one contact are shown as "Added" and disabled. */
  addedRoles?: ReadonlySet<ContactRole>
  /** Fully disables every tile (e.g. read-only). */
  disabled?: boolean
  /** When true, tiles stay clickable but look muted (plan limit reached). */
  quotaExhausted?: boolean
  onAddRole: (role: ContactRole) => void
}

/** Quick-add role tiles used in the empty state and the "People to consider" section. */
export function ContactsRoleSuggestions({
  variant,
  addedRoles,
  disabled = false,
  quotaExhausted = false,
  onAddRole,
}: ContactsRoleSuggestionsProps) {
  const { t } = useTranslation()
  const roleLabels = useContactRoleLabels()

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {CONTACT_ROLE_SUGGESTIONS.map((role) => {
        const added = addedRoles?.has(role) ?? false
        const isHardDisabled = disabled || added

        return (
          <button
            key={role}
            type="button"
            disabled={isHardDisabled}
            onClick={() => onAddRole(role)}
            aria-label={t('vault.contacts.consider.addRole', { role: roleLabels[role] })}
            className={cn(
              'group flex min-w-0 items-center gap-3 rounded-ep-panel border px-3 text-left transition',
              variant === 'card' ? 'py-3' : 'py-2',
              added
                ? 'cursor-default border-ep-border-subtle bg-ep-surface-subtle'
                : disabled
                  ? 'cursor-not-allowed border-ep-border-subtle bg-ep-surface opacity-60'
                  : quotaExhausted
                    ? 'border-ep-border-subtle bg-ep-surface opacity-60'
                    : 'border-ep-border-subtle bg-ep-surface hover:border-ep-primary/40 hover:bg-ep-primary-softer/40',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                added
                  ? 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
                  : 'bg-ep-primary-softer text-ep-primary dark:bg-ep-primary/15',
              )}
            >
              <ContactRoleIcon role={role} className="size-5" />
            </span>

            <span className="min-w-0 flex-1 overflow-hidden">
              <span
                className={cn(
                  'block truncate typo-body-sm-strong',
                  added ? 'text-slate-400 dark:text-slate-500' : 'text-ep-body dark:text-white',
                )}
              >
                {roleLabels[role]}
              </span>
              {variant === 'card' ? (
                <span className="mt-0.5 block truncate typo-caption text-slate-500 dark:text-slate-400">
                  {t(`vault.contacts.roleDescriptions.${role}`)}
                </span>
              ) : null}
            </span>

            <span className="shrink-0">
              {added ? (
                <span className="inline-flex items-center gap-1 typo-caption-strong text-green-600 dark:text-green-400">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {t('vault.contacts.consider.added')}
                </span>
              ) : (
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-md bg-ep-primary-softer text-ep-primary transition dark:bg-ep-primary/15',
                    !isHardDisabled &&
                      !quotaExhausted &&
                      'group-hover:bg-ep-primary group-hover:text-white',
                  )}
                >
                  <Plus className="h-4 w-4" />
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
