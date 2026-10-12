import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type KeyPersonStartOwnEndplanGateModalProps = {
  isOpen: boolean
  onStartOwnEndplan: () => void
  /** Footer link and secondary control: dismiss modal and freeze CTAs */
  onContinueFree: () => void
}

export function KeyPersonStartOwnEndplanGateModal({
  isOpen,
  onStartOwnEndplan,
  onContinueFree,
}: KeyPersonStartOwnEndplanGateModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <ActionDialogFrame
      title={t('trustedCircle.keyPersonGate.title')}
      description={
        <p className="typo-body-sm text-slate-600 dark:text-slate-300">{t('trustedCircle.keyPersonGate.body')}</p>
      }
      onClose={onContinueFree}
      icon={<Users className="h-5 w-5" strokeWidth={2.2} />}
      tone="default"
      maxWidthClassName="max-w-md"
    >
      <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
        <Button variant="primary" className="w-full" onClick={onStartOwnEndplan}>
          {t('trustedCircle.keyPersonGate.startCta')}
        </Button>
        <button
          type="button"
          onClick={onContinueFree}
          className="typo-body-sm text-center text-slate-600 underline decoration-slate-400 underline-offset-2 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
        >
          {t('trustedCircle.keyPersonGate.continueFree')}
        </button>
      </div>
    </ActionDialogFrame>
  )
}
