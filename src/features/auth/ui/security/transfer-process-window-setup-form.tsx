import { useTranslation, Trans } from 'react-i18next'
import { Check } from 'lucide-react'
import { Card } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { ALLOWED_PERIODS, RECOMMENDED_PERIOD } from '../../api/liveness-api'
import {
  TransferProcessLockGlyph,
  TransferProcessMailGlyph,
  TransferProcessSyncGlyph,
} from './transfer-process-step-glyphs'

function periodTileValue(days: number): string {
  return String(days)
}

function periodTileUnit(days: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (days === 1) return t('liveness.transferPage.unitDay')
  return t('liveness.transferPage.unitDays')
}

type TransferProcessWindowSetupFormProps = {
  selectedDays: number | null
  deadlineLabel: string | null
  readOnly?: boolean
  onSelectDays: (days: number) => void
  /** Saved period — edit modal shows a "Current" badge on this tile. */
  currentPeriodDays?: number | null
  /** Edit modal: period tiles only (no title, deadline alert, or step glyphs). */
  variant?: 'default' | 'edit'
}

export function TransferProcessWindowSetupForm({
  selectedDays,
  deadlineLabel,
  readOnly = false,
  onSelectDays,
  currentPeriodDays = null,
  variant = 'default',
}: TransferProcessWindowSetupFormProps) {
  const { t } = useTranslation()
  const isEditVariant = variant === 'edit'

  return (
    <Card
      padding={isEditVariant ? 'none' : 'md'}
      className={cn(
        isEditVariant
          ? 'w-full border-0 bg-transparent shadow-none dark:bg-transparent'
          : 'rounded-2xl border border-slate-200/90 bg-white shadow-md dark:border-slate-700 dark:bg-ep-surface-panel sm:p-8',
      )}
    >
      {isEditVariant ? null : (
        <h2 className="typo-heading-mini text-slate-900 dark:text-slate-100">{t('liveness.transferPage.cardTitle')}</h2>
      )}

      <div
        className={cn(
          isEditVariant ? 'flex w-full gap-2' : 'mt-5 grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-3.5',
        )}
      >
        {ALLOWED_PERIODS.map((days) => {
          const showCurrentBadge = isEditVariant
            ? currentPeriodDays != null && days === currentPeriodDays
            : days === RECOMMENDED_PERIOD
          const isSelected = selectedDays === days
          return (
            <div key={days} className={cn('relative', isEditVariant ? 'min-w-0 flex-1 pt-1.5' : 'pt-1')}>
              {showCurrentBadge ? (
                <span className="absolute -top-0.5 left-1/2 z-10 max-w-[calc(100%+6px)] -translate-x-1/2 truncate rounded-full bg-slate-900 px-1.5 py-0.5 typo-caption-emphasis uppercase leading-none tracking-tight text-white dark:bg-slate-100 dark:text-slate-900">
                  {t(
                    isEditVariant ? 'liveness.transferPage.current' : 'liveness.transferPage.mostPopular',
                  )}
                </span>
              ) : null}
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onSelectDays(days)}
                className={cn(
                  'relative flex w-full flex-col items-center justify-center rounded-lg px-2 text-center transition',
                  isEditVariant ? 'min-h-[72px] py-3 sm:min-h-[76px]' : 'min-h-[92px] border-2 py-4 sm:min-h-[100px]',
                  isSelected
                    ? cn(
                        'border-ep-primary bg-ep-primary text-white shadow-sm dark:border-ep-primary dark:bg-ep-primary',
                        isEditVariant ? 'border-2' : undefined,
                      )
                    : isEditVariant
                      ? 'border border-slate-200 bg-white text-slate-900 hover:border-slate-300 dark:border-slate-600 dark:bg-ep-surface-panel dark:text-slate-100 dark:hover:border-slate-500'
                      : 'border-2 border-slate-200 bg-white text-slate-900 hover:border-slate-300 dark:border-slate-600 dark:bg-ep-surface-panel dark:text-slate-100 dark:hover:border-slate-500',
                )}
              >
                <span
                  className={cn(
                    'leading-none tabular-nums',
                    'typo-heading-section',
                    isSelected ? 'text-white' : 'text-slate-950 dark:text-slate-50',
                  )}
                >
                  {periodTileValue(days)}
                </span>
                <span
                  className={cn(
                    'mt-1.5 typo-body-sm',
                    isSelected ? 'text-ep-primary-softer' : 'text-slate-600 dark:text-slate-400',
                  )}
                >
                  {periodTileUnit(days, t)}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {!isEditVariant && deadlineLabel ? (
        <div className="mt-6 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/40 sm:py-4">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <p className="typo-body-sm leading-relaxed text-emerald-950 dark:text-emerald-100">
            <Trans
              i18nKey="liveness.transferPage.alertDeadline"
              values={{ date: deadlineLabel }}
              components={{ bold: <strong className="typo-body-sm-emphasis" /> }}
            />
          </p>
        </div>
      ) : null}

      {isEditVariant ? null : (
      <div className="mt-7 grid grid-cols-3 border-t border-slate-200 pt-6 dark:border-slate-700">
        <div className="flex min-w-0 flex-col items-center border-r border-slate-200 px-2 py-2 text-center sm:px-4 dark:border-slate-700">
          <TransferProcessSyncGlyph />
          <div className="mt-2.5 space-y-0.5">
            <span className="block typo-body-sm leading-tight text-slate-600 dark:text-slate-300">
              {t('liveness.transferPage.step1Line1')}
            </span>
            <span className="block typo-body-sm leading-tight text-slate-600 dark:text-slate-300">
              {t('liveness.transferPage.step1Line2')}
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-center border-r border-slate-200 px-2 py-2 text-center sm:px-4 dark:border-slate-700">
          <TransferProcessMailGlyph />
          <div className="mt-2.5 space-y-0.5">
            <span className="block typo-body-sm leading-tight text-slate-600 dark:text-slate-300">
              {t('liveness.transferPage.step2Line1')}
            </span>
            <span className="block typo-body-sm leading-tight text-slate-600 dark:text-slate-300">
              {t('liveness.transferPage.step2Line2')}
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-center px-2 py-2 text-center sm:px-4">
          <TransferProcessLockGlyph />
          <div className="mt-2.5 space-y-0.5">
            <span className="block typo-body-sm leading-tight text-slate-600 dark:text-slate-300">
              {t('liveness.transferPage.step3Line1')}
            </span>
            <span className="block typo-body-sm leading-tight text-slate-600 dark:text-slate-300">
              {t('liveness.transferPage.step3Line2')}
            </span>
          </div>
        </div>
      </div>
      )}
    </Card>
  )
}
