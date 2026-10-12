import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, X } from 'lucide-react'
import { Button, Card, Input, ModalOverlay } from '@/shared/ui'
import { CONTACT_ROLES, type ContactFormInput, type ContactItem, type ContactRole } from '../../model/contacts'
import { useContactRoleLabels } from './use-contact-role-labels'

type ContactsAddEditModalProps = {
  /** The contact being edited, or null to add a new one. Mount this component only while open. */
  contact: ContactItem | null
  /** Preselected role when adding a new contact (e.g. from a quick-add role tile). */
  initialRole?: ContactRole
  isSaving: boolean
  onClose: () => void
  onSave: (input: ContactFormInput) => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactsAddEditModal({
  contact,
  initialRole,
  isSaving,
  onClose,
  onSave,
}: ContactsAddEditModalProps) {
  const { t } = useTranslation()
  const roleLabels = useContactRoleLabels()

  const [fullName, setFullName] = useState(contact?.fullName ?? '')
  const [role, setRole] = useState<ContactRole>(contact?.role ?? initialRole ?? 'lawyer')
  const [customRoleLabel, setCustomRoleLabel] = useState(contact?.customRoleLabel ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')
  const [showErrors, setShowErrors] = useState(false)

  const nameError = useMemo(
    () => (showErrors && !fullName.trim() ? t('vault.contacts.form.nameRequired') : null),
    [fullName, showErrors, t],
  )
  const emailError = useMemo(
    () =>
      showErrors && email.trim() && !EMAIL_PATTERN.test(email.trim())
        ? t('vault.contacts.form.emailInvalid')
        : null,
    [email, showErrors, t],
  )

  const isEditing = Boolean(contact)

  function handleSubmit() {
    if (!fullName.trim() || (email.trim() && !EMAIL_PATTERN.test(email.trim()))) {
      setShowErrors(true)
      return
    }
    onSave({
      id: contact?.id,
      fullName,
      role,
      customRoleLabel,
      phone,
      email,
      notes,
    })
  }

  return (
    <ModalOverlay onBackdropClick={isSaving ? undefined : onClose}>
      <Card className="w-full max-w-lg overflow-hidden rounded-[20px] p-0 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-ep-border-card px-5 py-4">
          <div className="min-w-0">
            <p className="typo-caption-emphasis uppercase tracking-[0.2em] text-ep-primary">
              {isEditing ? t('vault.contacts.form.editEyebrow') : t('vault.contacts.form.newEyebrow')}
            </p>
            <h3 className="mt-1 typo-heading-card text-ep-body dark:text-white">
              {isEditing ? t('vault.contacts.form.editTitle') : t('vault.contacts.form.addTitle')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label={t('common.close')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ep-body/50 transition hover:bg-ep-surface-subtle hover:text-ep-body disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
          <Input
            label={t('vault.contacts.form.fullNameLabel')}
            value={fullName}
            error={nameError}
            placeholder={t('vault.contacts.form.fullNamePlaceholder')}
            onChange={(event) => setFullName(event.target.value)}
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block typo-label" htmlFor="contact-role">
              {t('vault.contacts.form.roleLabel')}
            </label>
            <select
              id="contact-role"
              value={role}
              onChange={(event) => setRole(event.target.value as ContactRole)}
              className="ep-input-field"
            >
              {CONTACT_ROLES.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleLabels[roleOption]}
                </option>
              ))}
            </select>
          </div>

          {role === 'other' ? (
            <Input
              label={t('vault.contacts.form.customRoleLabel')}
              value={customRoleLabel}
              placeholder={t('vault.contacts.form.customRolePlaceholder')}
              onChange={(event) => setCustomRoleLabel(event.target.value)}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('vault.contacts.form.phoneLabel')}
              value={phone}
              type="tel"
              placeholder={t('vault.contacts.form.phonePlaceholder')}
              onChange={(event) => setPhone(event.target.value)}
            />
            <Input
              label={t('vault.contacts.form.emailLabel')}
              value={email}
              type="email"
              error={emailError}
              placeholder={t('vault.contacts.form.emailPlaceholder')}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block typo-label" htmlFor="contact-notes">
              {t('vault.contacts.form.notesLabel')}
            </label>
            <textarea
              id="contact-notes"
              value={notes}
              rows={3}
              placeholder={t('vault.contacts.form.notesPlaceholder')}
              onChange={(event) => setNotes(event.target.value)}
              className="ep-input-field min-h-[84px] resize-y"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-ep-primary-softer px-3 py-2.5 text-ep-primary dark:bg-ep-primary/10">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="typo-body-sm">{t('vault.contacts.form.encryptionNotice')}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-ep-border-card px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} loading={isSaving}>
            {isEditing ? t('vault.contacts.form.saveChanges') : t('vault.contacts.form.addContact')}
          </Button>
        </div>
      </Card>
    </ModalOverlay>
  )
}
