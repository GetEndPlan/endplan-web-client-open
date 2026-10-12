import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button, Card } from '@/shared/ui'
import type {
  ContactFormInput,
  ContactItem,
  ContactRole,
  ContactRoleFilter,
  ContactUpsertResult,
} from '../../model/contacts'
import { ContactsAddEditModal } from './contacts-add-edit-modal'
import { ContactsDeleteDialog } from './contacts-delete-dialog'
import { ContactsDetailPanel } from './contacts-detail-panel'
import { ContactsDetailPreview } from './contacts-detail-preview'
import { ContactsEmptyState } from './contacts-empty-state'
import { ContactsListPanel } from './contacts-list-panel'
import { ContactsRoleSuggestions } from './contacts-role-suggestions'
import { VaultCategoryQuotaLimitModal } from '../section/vault-category-quota-limit-modal'
import { VaultSuggestionsPanel } from '../suggestions'

type ModalState =
  | { open: false }
  | { open: true; contact: ContactItem | null; initialRole?: ContactRole }

type VaultContactsPageProps = {
  contacts: ContactItem[]
  filteredContacts: ContactItem[]
  contactsMax: number
  canAddMoreContacts: boolean
  selectedContactId: string | null
  selectedContact: ContactItem | null
  searchQuery: string
  roleFilter: ContactRoleFilter
  isSaving: boolean
  isReadOnly: boolean
  onSelectContact: (contactId: string | null) => void
  onSearchChange: (value: string) => void
  onRoleFilterChange: (value: ContactRoleFilter) => void
  onSave: (input: ContactFormInput) => Promise<ContactUpsertResult>
  onDelete: (contactId: string) => Promise<boolean>
}

export function VaultContactsPage({
  contacts,
  filteredContacts,
  contactsMax,
  canAddMoreContacts,
  selectedContactId,
  selectedContact,
  searchQuery,
  roleFilter,
  isSaving,
  isReadOnly,
  onSelectContact,
  onSearchChange,
  onRoleFilterChange,
  onSave,
  onDelete,
}: VaultContactsPageProps) {
  const { t } = useTranslation()
  const [modalState, setModalState] = useState<ModalState>({ open: false })
  const [contactPendingDelete, setContactPendingDelete] = useState<ContactItem | null>(null)
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false)
  const [isQuotaLimitModalOpen, setIsQuotaLimitModalOpen] = useState(false)

  const showAddActions = !isReadOnly
  const isContactQuotaExhausted = !canAddMoreContacts
  const addedRoles = useMemo(
    () => new Set<ContactRole>(contacts.map((contact) => contact.role)),
    [contacts],
  )

  const openAddModal = (initialRole?: ContactRole) =>
    setModalState({ open: true, contact: null, initialRole })
  const openEditModal = (contact: ContactItem) => setModalState({ open: true, contact })
  const closeModal = () => {
    if (isSaving) return
    setModalState({ open: false })
  }

  const requestAddContact = (initialRole?: ContactRole) => {
    if (isReadOnly) return
    if (isContactQuotaExhausted) {
      setIsQuotaLimitModalOpen(true)
      return
    }
    openAddModal(initialRole)
  }

  const handleAddRole = (role: ContactRole) => {
    requestAddContact(role)
  }

  const handleSave = async (input: ContactFormInput) => {
    const result = await onSave(input)
    if (result.success) {
      setModalState({ open: false })
    }
  }

  const handleConfirmDelete = async () => {
    if (!contactPendingDelete) return
    const ok = await onDelete(contactPendingDelete.id)
    if (ok) {
      setContactPendingDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">
          {t('vault.contacts.countLabel', { count: contacts.length, max: contactsMax })}
        </p>
        {showAddActions ? (
          <Button
            type="button"
            variant="primary"
            className={cn(isContactQuotaExhausted && 'opacity-60')}
            onClick={() => requestAddContact()}
          >
            <Plus className="h-4 w-4" />
            {t('vault.contacts.addContact')}
          </Button>
        ) : null}
      </div>

      {!suggestionsDismissed ? (
        <VaultSuggestionsPanel
          title={t('vault.contacts.consider.title')}
          subtitle={t('vault.contacts.consider.subtitle')}
          dismissLabel={t('common.close')}
          onDismiss={() => setSuggestionsDismissed(true)}
        >
          <ContactsRoleSuggestions
            variant="card"
            addedRoles={addedRoles}
            disabled={isReadOnly}
            quotaExhausted={!isReadOnly && isContactQuotaExhausted}
            onAddRole={handleAddRole}
          />
        </VaultSuggestionsPanel>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-stretch">
        <Card
          className={
            selectedContact
              ? 'hidden max-h-[80vh] p-4 md:flex md:min-h-[32rem] md:flex-col'
              : 'flex flex-col p-4 md:min-h-[32rem]'
          }
        >
          {contacts.length === 0 ? (
            <ContactsEmptyState
              showAdd={showAddActions}
              quotaExhausted={isContactQuotaExhausted}
              onAdd={() => requestAddContact()}
            />
          ) : (
            <ContactsListPanel
              contacts={contacts}
              filteredContacts={filteredContacts}
              selectedContactId={selectedContactId}
              searchQuery={searchQuery}
              roleFilter={roleFilter}
              showRoleSuggestions={false}
              onSelect={onSelectContact}
              onSearchChange={onSearchChange}
              onRoleFilterChange={onRoleFilterChange}
              onAddRole={handleAddRole}
            />
          )}
        </Card>

        <Card className={selectedContact ? 'p-6 md:min-h-[32rem]' : 'hidden p-6 md:block md:min-h-[32rem]'}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="typo-body-sm-emphasis text-ep-body dark:text-white">
              {t('vault.contacts.detailHeading')}
            </h3>
            {selectedContact && !isReadOnly ? (
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditModal(selectedContact)}
                >
                  <Pencil className="h-4 w-4" />
                  {t('common.edit')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setContactPendingDelete(selectedContact)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.delete')}
                </Button>
              </div>
            ) : null}
          </div>

          {selectedContact ? (
            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={() => onSelectContact(null)}
                className="inline-flex items-center gap-1 typo-body-sm text-ep-primary hover:underline md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('vault.contacts.detail.backToList')}
              </button>
              <ContactsDetailPanel contact={selectedContact} />
            </div>
          ) : (
            <div className="mt-2">
              <ContactsDetailPreview />
            </div>
          )}
        </Card>
      </div>

      {modalState.open ? (
        <ContactsAddEditModal
          contact={modalState.contact}
          initialRole={modalState.initialRole}
          isSaving={isSaving}
          onClose={closeModal}
          onSave={handleSave}
        />
      ) : null}

      <ContactsDeleteDialog
        open={Boolean(contactPendingDelete)}
        contactName={contactPendingDelete?.fullName ?? ''}
        isBusy={isSaving}
        onConfirm={handleConfirmDelete}
        onClose={() => (isSaving ? undefined : setContactPendingDelete(null))}
      />

      <VaultCategoryQuotaLimitModal
        isOpen={isQuotaLimitModalOpen}
        kind="contact"
        onClose={() => setIsQuotaLimitModalOpen(false)}
      />
    </div>
  )
}
