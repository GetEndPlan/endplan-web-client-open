import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type ScheduledAccountDeletionWelcomeModalProps = {
  isOpen: boolean
  daysRemaining: number
  firstName: string
  isRestoring: boolean
  onDismiss: () => void
  onRestore: () => void | Promise<void>
}

export function ScheduledAccountDeletionWelcomeModal({
  isOpen,
  daysRemaining,
  firstName,
  isRestoring,
  onDismiss,
  onRestore,
}: ScheduledAccountDeletionWelcomeModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleClose = isRestoring ? () => {} : onDismiss

  return (
    <ActionDialogFrame
      title={t('settings.erasure.scheduledDeletion.welcome.title')}
      subtitle={t('settings.erasure.scheduledDeletion.welcome.subtitle', { count: daysRemaining })}
      description={
        <div className="space-y-4">
          <p className="typo-body-sm-emphasis text-ep-body">
            {t('settings.erasure.scheduledDeletion.welcome.greeting', { name: firstName })}
          </p>
          <p>{t('settings.erasure.scheduledDeletion.welcome.body')}</p>
          <div className="rounded-lg border border-ep-border-subtle bg-ep-surface p-4">
            <p className="typo-body-sm-emphasis text-ep-body">
              {t('settings.erasure.scheduledDeletion.welcome.restoreTitle')}
            </p>
            <ul className="mt-3 list-none space-y-2.5 pl-0">
              {(['item1', 'item2', 'item3', 'item4'] as const).map((key) => (
                <li key={key} className="flex gap-2 typo-body-sm text-slate-700 dark:text-slate-200">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-500 dark:bg-slate-400" aria-hidden />
                  <span>{t(`settings.erasure.scheduledDeletion.welcome.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      }
      onClose={handleClose}
      icon={<CalendarClock className="h-5 w-5" strokeWidth={2.2} />}
      tone="default"
      maxWidthClassName="max-w-lg"
      showCloseButton
      closeButtonLabel={t('common.close')}
      isCloseDisabled={isRestoring}
    >
      <div className="flex flex-col-reverse gap-3 px-4 pb-4 sm:flex-row sm:justify-end sm:px-5 sm:pb-5">
        <Button variant="secondary" onClick={onDismiss} disabled={isRestoring}>
          {t('settings.erasure.scheduledDeletion.welcome.dismiss')}
        </Button>
        <Button
          variant="primary"
          className="bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:focus-visible:outline-slate-200"
          loading={isRestoring}
          onClick={() => void onRestore()}
        >
          {t('settings.erasure.scheduledDeletion.welcome.restore')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
