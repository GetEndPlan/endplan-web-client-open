import { useTranslation } from 'react-i18next'
import { Contact, Mail, Phone, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  contactInitials,
  contactRoleDisplayLabel,
  type ContactItem,
} from '../../model/contacts'
import { ContactRoleBadge } from './contact-role-visuals'
import { useContactRoleLabels } from './use-contact-role-labels'

type ContactsDetailPanelProps = {
  contact: ContactItem
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="typo-caption text-slate-400 dark:text-slate-500">{label}</p>
        <div className="mt-0.5 typo-body-sm text-ep-body dark:text-slate-100">{children}</div>
      </div>
    </div>
  )
}

export function ContactsDetailPanel({ contact }: ContactsDetailPanelProps) {
  const { t } = useTranslation()
  const roleLabels = useContactRoleLabels()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ep-primary-softer typo-body-sm-strong text-ep-primary dark:bg-ep-primary/15">
          {contactInitials(contact.fullName)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate typo-heading-card text-ep-body dark:text-white">
            {contact.fullName}
          </h3>
          <ContactRoleBadge contact={contact} roleLabels={roleLabels} className="mt-1" />
        </div>
      </div>

      <div className="divide-y divide-ep-border-subtle rounded-ep-panel border border-ep-border-subtle px-4">
        <DetailRow icon={User} label={t('vault.contacts.fields.name')}>
          {contact.fullName}
        </DetailRow>
        <DetailRow icon={Contact} label={t('vault.contacts.fields.role')}>
          {contactRoleDisplayLabel(contact, roleLabels)}
        </DetailRow>
        <DetailRow icon={Phone} label={t('vault.contacts.fields.phone')}>
          {contact.phone.trim() ? (
            <a
              href={`tel:${contact.phone.trim()}`}
              className="text-ep-primary hover:underline"
            >
              {contact.phone}
            </a>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">
              {t('vault.contacts.detail.notAdded')}
            </span>
          )}
        </DetailRow>
        <DetailRow icon={Mail} label={t('vault.contacts.fields.email')}>
          {contact.email.trim() ? (
            <a
              href={`mailto:${contact.email.trim()}`}
              className="break-all text-ep-primary hover:underline"
            >
              {contact.email}
            </a>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">
              {t('vault.contacts.detail.notAdded')}
            </span>
          )}
        </DetailRow>
      </div>

      {contact.notes.trim() ? (
        <div className="space-y-1">
          <p className="typo-caption-emphasis uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t('vault.contacts.form.notesLabel')}
          </p>
          <p className="whitespace-pre-wrap typo-body-sm text-ep-body dark:text-slate-100">
            {contact.notes}
          </p>
        </div>
      ) : null}
    </div>
  )
}
