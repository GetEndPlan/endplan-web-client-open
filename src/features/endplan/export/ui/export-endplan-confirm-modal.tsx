import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type ExportEndplanConfirmModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ExportEndplanConfirmModal({ isOpen, onClose, onConfirm }: ExportEndplanConfirmModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <ActionDialogFrame
      title={t('settings.export.modal.title')}
      description={
        <div className="space-y-4">
          <p>{t('settings.export.modal.body')}</p>
          <div className="rounded-lg border border-ep-border-subtle bg-ep-surface p-4">
            <p className="typo-body-sm-emphasis text-ep-body">{t('settings.export.modal.includesTitle')}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 typo-body-sm text-slate-700 dark:text-slate-200">
              {(['itemOverview', 'itemAssets', 'itemPolicies', 'itemContacts', 'itemInstructions', 'itemDocuments'] as const).map(
                (key) => (
                  <li key={key}>{t(`settings.export.modal.${key}`)}</li>
                ),
              )}
            </ul>
          </div>
          <p className="typo-body-sm text-slate-600 dark:text-slate-300">{t('settings.export.modal.keepTabOpen')}</p>
        </div>
      }
      onClose={onClose}
      icon={<Download className="h-5 w-5" strokeWidth={2.2} />}
      tone="default"
      maxWidthClassName="max-w-lg"
      showCloseButton
      closeButtonLabel={t('common.close')}
    >
      <div className="flex flex-col-reverse gap-3 px-4 pb-4 sm:flex-row sm:justify-end sm:px-5 sm:pb-5">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {t('settings.export.modal.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
