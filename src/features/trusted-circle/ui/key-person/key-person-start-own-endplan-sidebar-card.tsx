import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useKeyPersonStartOwnEndplanPrompt } from '@/features/endplan'
import { Button } from '@/shared/ui'
import { useStartOwnEndplanFlow } from '../../hooks/use-start-own-endplan-flow'

type KeyPersonStartOwnEndplanSidebarCardProps = {
  enabled?: boolean
  /** Desktop icon rail — no room for the card */
  isCollapsed: boolean
  /** Run before starting the flow (e.g. close mobile drawer) */
  onInteract?: () => void
}

export function KeyPersonStartOwnEndplanSidebarCard({
  enabled = true,
  isCollapsed,
  onInteract,
}: KeyPersonStartOwnEndplanSidebarCardProps) {
  const { t } = useTranslation()
  const { showBanner, ownerName } = useKeyPersonStartOwnEndplanPrompt({ enabled })
  const { startOwnEndplan, isStarting } = useStartOwnEndplanFlow()

  if (!enabled || !showBanner || isCollapsed) {
    return null
  }

  const name = ownerName || t('dashboard.keyPersonPrompt.someone')

  const handleClick = () => {
    onInteract?.()
    void startOwnEndplan()
  }

  return (
    <div className="shrink-0 px-2 pt-2 pb-1">
      <section
        className="rounded-lg border border-slate-200 bg-slate-100 p-3 dark:border-slate-600 dark:bg-ep-primary-dark/80"
        aria-label={t('dashboard.keyPersonPrompt.sidebarTitle')}
      >
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500 dark:bg-slate-400" aria-hidden />
          <p className="typo-caption-emphasis uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {t('dashboard.keyPersonPrompt.sidebarKicker')}
          </p>
        </div>
        <h3 className="mt-2 typo-body-sm-strong text-slate-900 dark:text-slate-100">
          {t('dashboard.keyPersonPrompt.sidebarTitle')}
        </h3>
        <p className="mt-1 typo-caption text-slate-600 dark:text-slate-300">
          {t('dashboard.keyPersonPrompt.sidebarSubtitle', { name })}
        </p>
        <Button
          type="button"
          variant="primary"
          className="mt-3 w-full"
          loading={isStarting}
          onClick={handleClick}
        >
          {t('dashboard.keyPersonPrompt.sidebarCta')}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </section>
    </div>
  )
}
