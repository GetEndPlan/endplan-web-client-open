import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type ScheduledAccountDeletionRestoredModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ScheduledAccountDeletionRestoredModal({ isOpen, onClose }: ScheduledAccountDeletionRestoredModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <ActionDialogFrame
      title={t('settings.erasure.scheduledDeletion.restored.title')}
      description={
        <div className="rounded-lg border border-ep-border-subtle bg-ep-surface p-4 text-left">
          <p className="typo-body-sm-emphasis text-ep-body">
            {t('settings.erasure.scheduledDeletion.restored.boxTitle')}
          </p>
          <p className="mt-2 typo-body-sm text-slate-700 dark:text-slate-200">
            {t('settings.erasure.scheduledDeletion.restored.body')}
          </p>
        </div>
      }
      onClose={onClose}
      icon={<CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />}
      tone="default"
      maxWidthClassName="max-w-md"
      showCloseButton
      closeButtonLabel={t('common.close')}
    >
      <div className="flex justify-center px-4 pb-4 sm:px-5 sm:pb-5">
        <Button
          type="button"
          variant="primary"
          className="min-w-[200px] bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:focus-visible:outline-slate-200"
          onClick={onClose}
        >
          {t('settings.erasure.scheduledDeletion.restored.goToDashboard')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
