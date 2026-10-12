import { useTranslation, Trans } from 'react-i18next'
import { Check } from 'lucide-react'
import { Card } from '@/shared/ui'
import {
  TransferProcessLockGlyph,
  TransferProcessMailGlyph,
  TransferProcessSyncGlyph,
} from './transfer-process-step-glyphs'

type TransferProcessActiveCardProps = {
  windowLabel: string
  signInByLabel: string | null
  readOnly?: boolean
  onEdit: () => void
}

export function TransferProcessActiveCard({
  windowLabel,
  signInByLabel,
  readOnly = false,
  onEdit,
}: TransferProcessActiveCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-ep-surface-panel sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 dark:bg-green-500"
            aria-hidden
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
          <p className="min-w-0 flex-1 typo-body-sm-emphasis leading-5 text-green-700 dark:text-green-400">
            {t('liveness.transferPage.active.status')}
          </p>
        </div>
        {readOnly ? null : (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 typo-body-sm-emphasis text-ep-primary underline decoration-ep-primary/40 underline-offset-2 transition hover:text-ep-primary-accent dark:text-ep-primary-accent dark:decoration-ep-primary-accent/40 dark:hover:text-ep-primary-muted"
          >
            {t('liveness.transferPage.active.edit')}
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 px-4 py-4 dark:border-slate-600">
          <p className="typo-caption-emphasis uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('liveness.transferPage.active.windowLabel')}
          </p>
          <p className="mt-2 typo-heading-section tabular-nums text-slate-950 dark:text-slate-50">{windowLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-200 px-4 py-4 dark:border-slate-600">
          <p className="typo-caption-emphasis uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('liveness.transferPage.active.signInByLabel')}
          </p>
          <p className="mt-2 typo-heading-section tabular-nums text-slate-950 dark:text-slate-50">
            {signInByLabel ?? '—'}
          </p>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 border-t border-slate-200 pt-6 dark:border-slate-700">
        <div className="flex min-w-0 flex-col items-center border-r border-slate-200 px-2 py-2 text-center sm:px-4 dark:border-slate-700">
          <TransferProcessSyncGlyph />
          <p className="mt-2.5 typo-body-sm leading-snug text-slate-600 dark:text-slate-300">
            <Trans
              i18nKey="liveness.transferPage.active.step1"
              components={{
                bold: <strong className="typo-body-sm typo-emphasis-bold text-slate-900 dark:text-slate-50" />,
              }}
            />
          </p>
        </div>
        <div className="flex min-w-0 flex-col items-center border-r border-slate-200 px-2 py-2 text-center sm:px-4 dark:border-slate-700">
          <TransferProcessMailGlyph />
          <p className="mt-2.5 typo-body-sm leading-snug text-slate-600 dark:text-slate-300">
            <Trans
              i18nKey="liveness.transferPage.active.step2"
              components={{
                bold: <strong className="typo-body-sm typo-emphasis-bold text-slate-900 dark:text-slate-50" />,
              }}
            />
          </p>
        </div>
        <div className="flex min-w-0 flex-col items-center px-2 py-2 text-center sm:px-4">
          <TransferProcessLockGlyph />
          <p className="mt-2.5 typo-body-sm leading-snug text-slate-600 dark:text-slate-300">
            <Trans
              i18nKey="liveness.transferPage.active.step3"
              components={{
                bold: <strong className="typo-body-sm typo-emphasis-bold text-slate-900 dark:text-slate-50" />,
              }}
            />
          </p>
        </div>
      </div>
    </Card>
  )
}
