import { Ban } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'
import type { ErasureRequest } from '../model/types'

type ErasureCancelModalProps = {
  request: ErasureRequest | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ErasureCancelModal({ request, isSubmitting, onClose, onConfirm }: ErasureCancelModalProps) {
  const { t } = useTranslation()

  if (!request) return null

  return (
    <ActionDialogFrame
      title={t('settings.erasure.cancelModal.title')}
      description={t('settings.erasure.cancelModal.description')}
      onClose={isSubmitting ? () => {} : onClose}
      icon={<Ban className="h-5 w-5" strokeWidth={2.2} />}
      tone="default"
      showCloseButton
      closeButtonLabel={t('common.close')}
      isCloseDisabled={isSubmitting}
    >
      <div className="flex flex-col-reverse gap-3 px-4 pb-4 sm:flex-row sm:justify-end sm:px-5 sm:pb-5">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" loading={isSubmitting} onClick={onConfirm}>
          {t('settings.erasure.cancelModal.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
