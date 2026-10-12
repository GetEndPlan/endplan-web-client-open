import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { ActionDialogFrame, Button } from '@/shared/ui'

type ContactsDeleteDialogProps = {
  open: boolean
  contactName: string
  isBusy: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ContactsDeleteDialog({
  open,
  contactName,
  isBusy,
  onConfirm,
  onClose,
}: ContactsDeleteDialogProps) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <ActionDialogFrame
      title={t('vault.contacts.delete.title')}
      description={t('vault.contacts.delete.description', { name: contactName })}
      onClose={onClose}
      icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} />}
      tone="danger"
    >
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isBusy}>
          {t('common.cancel')}
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} loading={isBusy}>
          {t('vault.contacts.delete.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
