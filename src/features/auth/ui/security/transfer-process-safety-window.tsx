import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SubscriptionAccessBanner } from '@/features/billing'
import { Button, Card } from '@/shared/ui'
import { formatDate } from '@/shared/lib/misc'
import { useLivenessSettings } from '../../hooks/use-liveness-settings'
import { TransferProcessActiveCard } from './transfer-process-active-card'
import { TransferProcessEditWindowModal } from './transfer-process-edit-window-modal'
import { computeSignInByIso, periodLabel } from './transfer-process-period'
import { TransferProcessWindowSetupForm } from './transfer-process-window-setup-form'

type TransferProcessSafetyWindowProps = {
  /** Trial/subscription ended — view current window only. */
  readOnly?: boolean
  interactionLocked?: boolean
  onInteractionBlocked?: () => void
}

function TransferProcessPageHeader() {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <p className="typo-caption-emphasis uppercase tracking-[0.18em] text-ep-primary dark:text-ep-primary-accent">
        {t('liveness.transferPage.kicker')}
      </p>
      <h1 className="typo-heading-page-static text-slate-950 dark:text-slate-50">{t('liveness.transferPage.title')}</h1>
    </div>
  )
}

export function TransferProcessSafetyWindow({
  readOnly = false,
  interactionLocked = false,
  onInteractionBlocked,
}: TransferProcessSafetyWindowProps) {
  const { t } = useTranslation()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const {
    liveness,
    selectedDays,
    isLoading,
    isSaving,
    handleQuickSelect,
    handleCompleteSetup,
    clearUserSelection,
  } = useLivenessSettings({ readOnly })

  const blockOr = (action: () => void) => {
    if (readOnly) {
      return
    }
    if (interactionLocked) {
      onInteractionBlocked?.()
      return
    }
    action()
  }

  const configuredDays = liveness?.inactivityPeriodDays ?? null
  const isConfigured = configuredDays != null

  const setupPreviewDays = selectedDays
  const setupDeadlineIso = computeSignInByIso(liveness?.lastActiveAt ?? null, setupPreviewDays, null)
  const setupDeadlineLabel = setupDeadlineIso ? formatDate(setupDeadlineIso) : null

  const activeSignInByIso = isConfigured
    ? computeSignInByIso(liveness?.lastActiveAt ?? null, configuredDays, liveness?.releaseTriggerAt)
    : null
  const activeSignInByLabel = activeSignInByIso ? formatDate(activeSignInByIso) : null
  const activeWindowLabel = configuredDays != null ? periodLabel(configuredDays, t) : ''

  const openEdit = () => {
    clearUserSelection()
    setIsEditOpen(true)
  }

  const closeEdit = () => {
    if (isSaving) return
    clearUserSelection()
    setIsEditOpen(false)
  }

  const saveSetup = async () => {
    await handleCompleteSetup()
  }

  const saveEdit = async () => {
    const ok = await handleCompleteSetup()
    if (ok) setIsEditOpen(false)
  }

  if (isLoading) {
    return (
      <Card className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
      </Card>
    )
  }

  const readOnlyBanner = readOnly ? (
    <SubscriptionAccessBanner message={t('liveness.transferPage.readOnly.banner')} />
  ) : null

  if (isConfigured) {
    return (
      <>
        <div className="mx-auto max-w-2xl space-y-6">
          <TransferProcessPageHeader />
          {readOnlyBanner}

          <p className="typo-body-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t('liveness.transferPage.active.intro')}
          </p>

          <TransferProcessActiveCard
            windowLabel={activeWindowLabel}
            signInByLabel={activeSignInByLabel}
            readOnly={readOnly}
            onEdit={() => blockOr(openEdit)}
          />

          <p className="text-center typo-body-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {t('liveness.transferPage.active.footerNote')}
          </p>
        </div>

        <TransferProcessEditWindowModal
          isOpen={isEditOpen}
          selectedDays={selectedDays ?? configuredDays}
          currentPeriodDays={configuredDays}
          isSaving={isSaving}
          onSelectDays={(days) => blockOr(() => handleQuickSelect(days))}
          onClose={closeEdit}
          onSave={() => blockOr(() => void saveEdit())}
        />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <TransferProcessPageHeader />
          {readOnlyBanner}
          <p className="typo-body-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t('liveness.transferPage.description')}
          </p>
        </div>

        <TransferProcessWindowSetupForm
          selectedDays={selectedDays}
          deadlineLabel={setupDeadlineLabel}
          readOnly={readOnly}
          onSelectDays={(days) => blockOr(() => handleQuickSelect(days))}
        />

        <div className="w-full">
          <Button
            type="button"
            size="lg"
            className="w-full rounded-lg"
            disabled={readOnly || isSaving || selectedDays == null}
            loading={isSaving}
            onClick={() => blockOr(() => void saveSetup())}
          >
            {selectedDays != null
              ? t('liveness.transferPage.setWindow', { period: periodLabel(selectedDays, t) })
              : t('liveness.transferPage.setWindowPlaceholder')}
          </Button>
        </div>

      <div className="px-0.5">
        <p className="text-center typo-body-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t('liveness.transferPage.footerNote')}
        </p>
      </div>
    </div>
  )
}
