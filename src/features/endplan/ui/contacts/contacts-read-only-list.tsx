import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui'
import { normalizeContactsPayload } from '../../model/contacts'
import { ContactsDetailPanel } from './contacts-detail-panel'

type ContactsReadOnlyListProps = {
  content: unknown
}

/** Renders decrypted contacts for shared-vault viewers (no edit/delete actions). */
export function ContactsReadOnlyList({ content }: ContactsReadOnlyListProps) {
  const { t } = useTranslation()
  const contacts = useMemo(() => normalizeContactsPayload(content).items, [content])

  if (contacts.length === 0) {
    return (
      <Card className="p-5">
        <p className="typo-body-sm italic text-slate-500 dark:text-slate-400">
          {t('sharedVault.emptySection', 'No items in this section.')}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <Card key={contact.id} className="p-5">
          <ContactsDetailPanel contact={contact} />
        </Card>
      ))}
    </div>
  )
}
