import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button, Card, settingsSubCardClassName, settingsSubCardPaddingClassName, toast } from '@/shared/ui'
import { formatDate } from '@/shared/lib'
import { useAuthUser } from '@/features/auth'
import { useSubscription } from '@/features/billing'
import type { Subscription } from '@/features/billing/api/billing-api'
import { useMemberships, type TrustedCircleMembership } from '@/features/trusted-circle/api'
import { RecoveryKeyCard } from '@/features/keys'
import type { ErasureKind } from '../model/types'
import {
  erasureApiMessage,
  hasActiveErasureForKind,
  useErasureRequestsQuery,
  useScheduleErasureMutation,
} from '../api'
import { ErasureAccountPaidSubscriptionGateModal } from './erasure-account-paid-subscription-gate-modal'
import { ErasureAccountDeleteModal } from './erasure-account-delete-modal'
import { ErasureScheduleModal } from './erasure-schedule-modal'

function buildOwnerNotifySummary(memberships: TrustedCircleMembership[], t: TFunction): string {
  const active = memberships.filter(
    (m) => m.role === 'key_person' && (m.status === 'active' || m.status === 'suspended'),
  )
  const byOwner = new Map<string, string>()
  for (const m of active) {
    const label = (m.member?.name ?? m.member?.email ?? '').trim()
    if (label) {
      byOwner.set(m.ownerId, label)
    }
  }
  const labels = [...byOwner.values()]
  if (labels.length === 0) {
    return t('settings.erasure.accountModal.step1.keyPersonsNotifyGeneric')
  }
  if (labels.length === 1) {
    return t('settings.erasure.accountModal.step1.keyPersonsNotifyOne', { name: labels[0] })
  }
  const first = (labels[0]!.split(/\s+/)[0] || labels[0])!
  const others = labels.length - 1
  return t('settings.erasure.accountModal.step1.keyPersonsNotifySome', { first, count: others })
}

const deleteDataButtonClassName = cn(
  'bg-white text-red-700 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-50',
  'dark:bg-ep-surface-panel dark:text-red-400 dark:ring-red-500/40 dark:hover:bg-red-950/30',
)

function paidSubscriptionGatePlanLine(sub: Subscription, t: TFunction): string {
  const tierLabel =
    sub.tier === 'pro' ? t('settings.erasure.paidGate.tierPro') : t('settings.erasure.paidGate.tierBasic')
  const intervalLabel =
    sub.billingInterval === 'year' ? t('settings.erasure.paidGate.intervalYear') : t('settings.erasure.paidGate.intervalMonth')
  return `${tierLabel} · ${intervalLabel}`
}

export function SettingsDataPrivacyPanel({ exportCard }: { exportCard?: ReactNode }) {
  const { t } = useTranslation()
  const { user } = useAuthUser()
  const subscriptionEnabled = !!user
  const { data: subscriptionResponse, isFetched: subscriptionFetched } = useSubscription({
    enabled: subscriptionEnabled,
  })
  const subscription = subscriptionResponse?.subscription ?? null
  const inTrial = subscriptionResponse?.inTrial ?? false
  const hasActivePaidSubscription = Boolean(
    subscriptionResponse?.hasActiveSubscription &&
      !subscriptionResponse?.inTrial &&
      subscription &&
      subscription.status !== 'trialing',
  )
  const paidGatePlanLine = useMemo(
    () => (subscription && hasActivePaidSubscription ? paidSubscriptionGatePlanLine(subscription, t) : ''),
    [subscription, hasActivePaidSubscription, t],
  )
  const paidGatePeriodEnd = subscription?.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd)
    : ''
  const { data: memberships = [] } = useMemberships({ enabled: subscriptionEnabled })

  const { data: requests } = useErasureRequestsQuery()
  const schedule = useScheduleErasureMutation()

  const [scheduleKind, setScheduleKind] = useState<ErasureKind | null>(null)
  const [showPaidSubscriptionGate, setShowPaidSubscriptionGate] = useState(false)

  const activeData = useMemo(() => hasActiveErasureForKind(requests, 'endplan_data'), [requests])
  const activeAccount = useMemo(() => hasActiveErasureForKind(requests, 'full_account'), [requests])

  const ownerNotifySummary = useMemo(() => buildOwnerNotifySummary(memberships, t), [memberships, t])

  const handleScheduleData = async () => {
    try {
      await schedule.mutateAsync('endplan_data')
      setScheduleKind(null)
      toast.success(t('settings.erasure.toast.scheduledData'))
    } catch (e) {
      toast.error(erasureApiMessage(e) ?? t('settings.erasure.toast.scheduleError'))
    }
  }

  const openAccountDeletionFlow = () => {
    if (hasActivePaidSubscription) {
      setShowPaidSubscriptionGate(true)
      return
    }
    setScheduleKind('full_account')
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="typo-heading-card text-slate-900 dark:text-slate-100">{t('settings.erasure.title')}</h2>
          <p className="mt-1 typo-body text-slate-600 dark:text-slate-300">{t('settings.erasure.intro')}</p>
        </div>

        <RecoveryKeyCard />

        {exportCard}

        <Card padding="none" className={settingsSubCardClassName}>
          {inTrial ? (
            <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <p className="typo-body-sm-strong text-amber-900 dark:text-amber-200">{t('settings.erasure.trialBanner')}</p>
            </div>
          ) : null}

          <div className={cn(settingsSubCardPaddingClassName, 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8')}>
            <div className="min-w-0 flex-1">
              <h3 className="typo-body-md-emphasis text-slate-900 dark:text-slate-100">
                {t('settings.erasure.sectionDataTitle')}
              </h3>
              <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-300">{t('settings.erasure.sectionDataBody')}</p>
              {activeData ? (
                <p className="mt-2 typo-body-sm text-amber-800 dark:text-amber-300">{t('settings.erasure.alreadyScheduledData')}</p>
              ) : null}
            </div>
            <Button
              variant="secondary"
              className={cn(deleteDataButtonClassName, 'shrink-0')}
              disabled={activeData || schedule.isPending}
              loading={schedule.isPending && scheduleKind === 'endplan_data'}
              onClick={() => setScheduleKind('endplan_data')}
            >
              {t('settings.erasure.sectionDataAction')}
            </Button>
          </div>

          <div
            className={cn(
              settingsSubCardPaddingClassName,
              'flex flex-col gap-4 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-between sm:gap-8 dark:border-ep-border-card',
            )}
          >
            <div className="min-w-0 flex-1">
              <h3 className="typo-body-md-emphasis text-slate-900 dark:text-slate-100">
                {t('settings.erasure.sectionAccountTitle')}
              </h3>
              <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-300">{t('settings.erasure.sectionAccountBody')}</p>
              {activeAccount ? (
                <p className="mt-2 typo-body-sm text-red-800 dark:text-red-300">{t('settings.erasure.alreadyScheduledAccount')}</p>
              ) : null}
            </div>
            <Button
              variant="danger"
              className="shrink-0"
              disabled={
                activeAccount ||
                schedule.isPending ||
                (subscriptionEnabled && !subscriptionFetched)
              }
              loading={schedule.isPending && scheduleKind === 'full_account'}
              onClick={openAccountDeletionFlow}
            >
              {t('settings.erasure.sectionAccountAction')}
            </Button>
          </div>
        </Card>
      </div>

      <ErasureAccountPaidSubscriptionGateModal
        isOpen={showPaidSubscriptionGate}
        planLine={paidGatePlanLine}
        periodEndLabel={paidGatePeriodEnd}
        onClose={() => setShowPaidSubscriptionGate(false)}
        onContinue={() => {
          setShowPaidSubscriptionGate(false)
          setScheduleKind('full_account')
        }}
      />

      <ErasureScheduleModal
        isOpen={scheduleKind === 'endplan_data'}
        isSubmitting={schedule.isPending}
        onClose={() => setScheduleKind(null)}
        onConfirm={handleScheduleData}
      />

      <ErasureAccountDeleteModal
        isOpen={scheduleKind === 'full_account'}
        userEmail={user?.email ?? ''}
        ownerNotifySummary={ownerNotifySummary}
        isSubmitting={schedule.isPending}
        onClose={() => setScheduleKind(null)}
        onSchedule={() => schedule.mutateAsync('full_account')}
        onScheduled={() => {
          toast.success(t('settings.erasure.toast.scheduledAccount'))
        }}
      />
    </>
  )
}
