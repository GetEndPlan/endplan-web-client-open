import { useTranslation } from 'react-i18next'
import { Card, Button } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import {
  ALLOWED_PERIODS,
  RECOMMENDED_PERIOD,
} from '../../api/liveness-api'
import { useLivenessSettings } from '../../hooks/use-liveness-settings'

type LivenessSettingsCardProps = {
  /** When true, period controls and save act as blocked until `onInteractionBlocked` is used */
  interactionLocked?: boolean
  onInteractionBlocked?: () => void
}

const PERIOD_365 = 365

function periodLabel(
  days: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (days === 1) return t('liveness.oneDay')
  if (days === 2) return t('liveness.twoDays')
  if (days === PERIOD_365) return t('liveness.oneYear')
  return t('liveness.days', { count: days })
}

export function LivenessSettingsCard({
  interactionLocked = false,
  onInteractionBlocked,
}: LivenessSettingsCardProps) {
  const { t } = useTranslation()
  const {
    selectedDays,
    isLoading,
    isSaving,
    handleQuickSelect,
    handleCompleteSetup,
  } = useLivenessSettings()

  const blockOr = (action: () => void) => {
    if (interactionLocked) {
      onInteractionBlocked?.()
      return
    }
    action()
  }

  if (isLoading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400">{t('common.loading')}</div>
      </Card>
    )
  }

  return (
    <Card className="p-6">

      <h2 className="typo-heading-card text-slate-900 dark:text-slate-100 mb-3">
        {t('liveness.setInactivityPeriod')}
      </h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {ALLOWED_PERIODS.map((days) => {
          const isRecommended = days === RECOMMENDED_PERIOD
          const isSelected = selectedDays === days
          return (
            <button
              key={days}
              type="button"
              onClick={() => blockOr(() => handleQuickSelect(days))}
              className={cn(
                'px-4 py-2 rounded-lg typo-body-sm-strong transition border',
                isSelected
                  ? 'border-ep-primary bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary-dark/30 dark:text-ep-primary-muted dark:border-ep-primary'
                  : 'border-slate-200 dark:border-ep-border-card bg-white dark:bg-ep-surface-panel text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-ep-primary-muted'
              )}
            >
              {periodLabel(days, t)}
              {isRecommended && (
                <span className="ml-1 typo-caption opacity-80">({t('liveness.recommended')})</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-8">
        <Button
          onClick={() => blockOr(() => void handleCompleteSetup())}
          disabled={isSaving || selectedDays == null}
          className="w-full sm:w-auto"
        >
          {isSaving ? t('liveness.saving') : t('liveness.completeSetup')}
        </Button>
      </div>
    </Card>
  )
}
