import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui'
import { pricingFeatureLinesForTier } from '../../model/plan-limit-display'
import type { Product, Subscription } from '../../api'
import { BillingPlanCard } from './billing-plan-card'

type BillingPricingPlansProps = {
  isLoading: boolean
  subscription: Subscription | null
  hasActiveSubscription: boolean
  basicMonthlyProduct?: Product
  basicYearlyProduct?: Product
  proMonthlyProduct?: Product
  proYearlyProduct?: Product
  basicYearlySavings: number
  proYearlySavings: number
  isCreatingCheckout: boolean
  /** Disables all plan CTAs (e.g. key person acknowledge or checkout in flight). */
  flowPending?: boolean
  /** Third column for key persons starting their own EndPlan (same server action as “continue for free”). */
  keyPersonTrialColumn?: {
    onStartTrial: () => void
    isPending: boolean
  }
  onSubscribe: (tier: 'basic' | 'pro', interval: 'monthly' | 'yearly') => void
  formatPrice: (amount: number, currency: string) => string
}

type BillingInterval = 'monthly' | 'yearly'

type PlanModel = {
  key: 'basic' | 'pro'
  title: string
  subtitle: string
  priceText: string
  periodLabel: string
  monthlyEquivalentText?: string
  badgeText?: string
  featured?: boolean
  features: string[]
  ctaLabel: string
  ctaVariant: 'primary' | 'secondary'
  ctaDisabled: boolean
  onSubscribe: () => void
}

const BASIC_FEATURES = pricingFeatureLinesForTier('basic')
const PRO_FEATURES = pricingFeatureLinesForTier('pro')

const KEY_PERSON_TRIAL_FEATURES_KEYS = [
  'settings.billing.upgradeModal.keyPersonFreeTrialFeature1',
  'settings.billing.upgradeModal.keyPersonFreeTrialFeature2',
  'settings.billing.upgradeModal.keyPersonFreeTrialFeature3',
  'settings.billing.upgradeModal.keyPersonFreeTrialFeature4',
] as const

export function BillingPricingPlans({
  isLoading,
  subscription,
  hasActiveSubscription,
  basicMonthlyProduct: bm,
  basicYearlyProduct: by,
  proMonthlyProduct: pm,
  proYearlyProduct: py,
  basicYearlySavings,
  proYearlySavings,
  isCreatingCheckout,
  flowPending = false,
  keyPersonTrialColumn,
  onSubscribe,
  formatPrice,
}: BillingPricingPlansProps) {
  const { t } = useTranslation()
  const [interval, setInterval] = useState<BillingInterval>('yearly')
  const trialFeatures = useMemo(
    () => KEY_PERSON_TRIAL_FEATURES_KEYS.map((key) => t(key)),
    [t],
  )

  const plans = useMemo(() => {
    return [
      buildPlanModel({
        tier: 'basic',
        title: 'Basic',
        subtitle: 'Ideal for getting started with secure EndPlan planning.',
        monthlyProduct: bm,
        yearlyProduct: by,
        interval,
        savingsPercent: basicYearlySavings,
        hasActiveSubscription,
        subscription,
        features: BASIC_FEATURES,
        onSubscribe,
        formatPrice,
      }),
      buildPlanModel({
        tier: 'pro',
        title: 'Pro',
        subtitle: 'For advanced planning with more capacity and support.',
        monthlyProduct: pm,
        yearlyProduct: py,
        interval,
        savingsPercent: proYearlySavings,
        hasActiveSubscription,
        subscription,
        features: PRO_FEATURES,
        onSubscribe,
        formatPrice,
        featured: true,
      }),
    ] as const
  }, [
    bm,
    by,
    pm,
    py,
    interval,
    basicYearlySavings,
    proYearlySavings,
    hasActiveSubscription,
    subscription,
    onSubscribe,
    formatPrice,
  ])

  if (isLoading) {
    return <BillingPricingSkeleton columnCount={keyPersonTrialColumn ? 3 : 2} />
  }

  const gridCols = keyPersonTrialColumn ? 'lg:grid-cols-3' : 'lg:grid-cols-2'

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-ep-surface-panel">
          <IntervalButton
            isActive={interval === 'monthly'}
            label="Monthly"
            onClick={() => setInterval('monthly')}
          />
          <IntervalButton
            isActive={interval === 'yearly'}
            label="Annual"
            onClick={() => setInterval('yearly')}
          />
        </div>
      </div>

      <div className={`grid gap-5 ${gridCols}`}>
        {keyPersonTrialColumn ? (
          <BillingPlanCard
            key="key-person-free-trial"
            title={t('settings.billing.upgradeModal.keyPersonFreeTrialTitle')}
            subtitle={t('settings.billing.upgradeModal.keyPersonFreeTrialDescription')}
            priceText={t('settings.billing.upgradeModal.keyPersonFreeTrialPrice')}
            periodLabel={t('settings.billing.upgradeModal.keyPersonFreeTrialPeriod')}
            featured={false}
            features={trialFeatures}
            ctaLabel={t('settings.billing.upgradeModal.keyPersonFreeTrialCta')}
            ctaVariant="secondary"
            isCreatingCheckout={isCreatingCheckout}
            ignoreCheckoutLoading
            ctaLoading={keyPersonTrialColumn.isPending}
            disabled={flowPending}
            onSubscribe={keyPersonTrialColumn.onStartTrial}
          />
        ) : null}
        {plans.map((plan) => (
          <BillingPlanCard
            key={plan.key}
            title={plan.title}
            subtitle={plan.subtitle}
            priceText={plan.priceText}
            periodLabel={plan.periodLabel}
            monthlyEquivalentText={plan.monthlyEquivalentText}
            badgeText={plan.badgeText}
            featured={plan.featured}
            features={plan.features}
            ctaLabel={plan.ctaLabel}
            ctaVariant={plan.ctaVariant}
            isCreatingCheckout={isCreatingCheckout}
            disabled={plan.ctaDisabled || flowPending}
            onSubscribe={plan.onSubscribe}
          />
        ))}
      </div>
    </div>
  )
}

function IntervalButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 typo-body-sm transition-colors ${
        isActive
          ? 'bg-white text-ep-primary shadow-sm dark:bg-slate-700 dark:text-ep-primary-muted'
          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

function BillingPricingSkeleton({ columnCount }: { columnCount: number }) {
  const cols = columnCount >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
  return (
    <div className={`grid gap-5 ${cols}`}>
      {Array.from({ length: columnCount }, (_, i) => (
        <Card key={i} className="animate-pulse p-0">
          <div className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-700" />
        </Card>
      ))}
    </div>
  )
}

function formatPlanPrice(
  product: Product | undefined,
  formatPrice: (amount: number, currency: string) => string,
): string {
  if (!product) {
    return '—'
  }
  return formatPrice(product.priceAmount, product.priceCurrency)
}

function getMonthlyEquivalent(
  yearlyProduct: Product | undefined,
  formatPrice: (amount: number, currency: string) => string,
): string | undefined {
  if (!yearlyProduct) {
    return undefined
  }

  const monthlyAmount = Math.round(yearlyProduct.priceAmount / 12)
  return `${formatPrice(monthlyAmount, yearlyProduct.priceCurrency)} / month billed annually`
}

function resolveCtaLabelAndState({
  tier,
  interval,
  product,
  hasActiveSubscription,
  subscription,
}: {
  tier: 'basic' | 'pro'
  interval: BillingInterval
  product: Product | undefined
  hasActiveSubscription: boolean
  subscription: Subscription | null
}) {
  if (!product) {
    return { ctaLabel: 'Unavailable', ctaVariant: 'secondary' as const, ctaDisabled: true }
  }

  if (!hasActiveSubscription || !subscription) {
    return { ctaLabel: 'Upgrade', ctaVariant: 'primary' as const, ctaDisabled: false }
  }

  const intervalKey = interval === 'monthly' ? 'month' : 'year'
  const isCurrentTier = subscription.tier === tier
  const isCurrentInterval = subscription.billingInterval === intervalKey

  if (isCurrentTier && isCurrentInterval) {
    return { ctaLabel: 'Current plan', ctaVariant: 'secondary' as const, ctaDisabled: true }
  }

  if (isCurrentTier) {
    return {
      ctaLabel: interval === 'monthly' ? 'Switch to Monthly' : 'Switch to Annual',
      ctaVariant: 'primary' as const,
      ctaDisabled: false,
    }
  }

  return { ctaLabel: 'Upgrade', ctaVariant: 'primary' as const, ctaDisabled: false }
}

function buildPlanModel({
  tier,
  title,
  subtitle,
  monthlyProduct,
  yearlyProduct,
  interval,
  savingsPercent,
  hasActiveSubscription,
  subscription,
  features,
  onSubscribe,
  formatPrice,
  featured = false,
}: {
  tier: 'basic' | 'pro'
  title: string
  subtitle: string
  monthlyProduct: Product | undefined
  yearlyProduct: Product | undefined
  interval: BillingInterval
  savingsPercent: number
  hasActiveSubscription: boolean
  subscription: Subscription | null
  features: string[]
  onSubscribe: (tier: 'basic' | 'pro', interval: BillingInterval) => void
  formatPrice: (amount: number, currency: string) => string
  featured?: boolean
}): PlanModel {
  const selectedProduct = interval === 'monthly' ? monthlyProduct : yearlyProduct
  const cta = resolveCtaLabelAndState({
    tier,
    interval,
    product: selectedProduct,
    hasActiveSubscription,
    subscription,
  })

  return {
    key: tier,
    title,
    subtitle,
    priceText: formatPlanPrice(selectedProduct, formatPrice),
    periodLabel: interval === 'monthly' ? '/month' : '/year',
    monthlyEquivalentText: interval === 'yearly' ? getMonthlyEquivalent(yearlyProduct, formatPrice) : undefined,
    badgeText: interval === 'yearly' && savingsPercent > 0
      ? `Save ${savingsPercent}%`
      : featured
        ? 'Popular'
        : undefined,
    featured,
    features,
    ctaLabel: cta.ctaLabel,
    ctaVariant: cta.ctaVariant,
    ctaDisabled: cta.ctaDisabled,
    onSubscribe: () => onSubscribe(tier, interval),
  }
}
