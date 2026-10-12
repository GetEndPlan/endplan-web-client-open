import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card, settingsSubCardClassName, settingsSubCardPaddingClassName } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { useEndplanExportStart } from '../hooks/use-endplan-export-start'
import { ExportEndplanConfirmModal } from './export-endplan-confirm-modal'

export function ExportEndplanCard() {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const {
    canStart,
    isRunning,
    isVaultLoading,
    hasVault,
    hasRequiredKeys,
    toastHidden,
    showProgress,
    startExport,
  } = useEndplanExportStart()

  const helperText = !hasVault
    ? t('settings.export.noVault')
    : !hasRequiredKeys
      ? t('settings.export.needsUnlock')
      : null

  return (
    <>
      <Card padding="none" className={settingsSubCardClassName}>
        <div
          className={cn(
            settingsSubCardPaddingClassName,
            'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8',
          )}
        >
          <div className="min-w-0 flex-1">
            <h3 className="typo-body-md-emphasis text-slate-900 dark:text-slate-100">
              {t('settings.export.sectionTitle')}
            </h3>
            <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-300">{t('settings.export.sectionBody')}</p>
            {helperText ? (
              <p className="mt-2 typo-body-sm text-slate-500 dark:text-slate-400">{helperText}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <Button
              className="shrink-0"
              disabled={!canStart || isVaultLoading}
              loading={isRunning || isVaultLoading}
              onClick={() => setConfirmOpen(true)}
            >
              {isRunning ? t('settings.export.actionRunning') : t('settings.export.action')}
            </Button>
            {isRunning && toastHidden ? (
              <button
                type="button"
                onClick={showProgress}
                className="typo-caption-strong text-left text-slate-600 underline-offset-2 hover:underline dark:text-slate-300 sm:text-right"
              >
                {t('settings.export.showProgress')}
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <ExportEndplanConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={startExport}
      />
    </>
  )
}
