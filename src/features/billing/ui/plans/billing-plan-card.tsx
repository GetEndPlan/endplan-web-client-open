import { Button } from '@/shared/ui'

type BillingPlanCardProps = {
  title: string
  subtitle: string
  priceText: string
  periodLabel: string
  monthlyEquivalentText?: string
  badgeText?: string
  featured?: boolean
  features: string[]
  ctaLabel: string
  ctaVariant?: 'primary' | 'secondary'
  isCreatingCheckout: boolean
  /** When set, shows loading on this card’s CTA without treating it as checkout (e.g. key person trial acknowledge). */
  ctaLoading?: boolean
  /** When true, ignore parent `isCreatingCheckout` for this card (e.g. free trial column during paid checkout). */
  ignoreCheckoutLoading?: boolean
  disabled: boolean
  onSubscribe: () => void
}

export function BillingPlanCard({
  title,
  subtitle,
  priceText,
  periodLabel,
  monthlyEquivalentText,
  badgeText,
  featured = false,
  features,
  ctaLabel,
  ctaVariant = 'primary',
  isCreatingCheckout,
  ctaLoading = false,
  ignoreCheckoutLoading = false,
  disabled,
  onSubscribe,
}: BillingPlanCardProps) {
  const isPrimaryCta = ctaVariant === 'primary'
  const checkoutSpinner = ignoreCheckoutLoading ? false : isCreatingCheckout
  const showButtonLoading = checkoutSpinner || ctaLoading
  const blockInteraction = disabled || checkoutSpinner || ctaLoading

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-colors ${
        featured
          ? 'border-ep-primary-soft bg-ep-primary-softer/40 dark:border-ep-primary/40 dark:bg-ep-surface-panel'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-ep-surface-panel'
      }`}
    >
      {badgeText && (
        <span className="mb-3 inline-flex w-fit items-center rounded-md bg-ep-primary-softer px-2 py-1 typo-caption text-ep-primary-accent dark:bg-ep-primary-dark/50 dark:text-ep-primary-muted">
          {badgeText}
        </span>
      )}

      <p className="typo-body-sm text-slate-500 dark:text-slate-400">{title}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="typo-heading-display text-slate-900 dark:text-slate-100">{priceText}</span>
        <span className="pb-2 typo-body-sm text-slate-500 dark:text-slate-400">{periodLabel}</span>
      </div>

      <p className="mt-2 typo-body-sm text-slate-700 dark:text-slate-200">{subtitle}</p>
      {monthlyEquivalentText && (
        <p className="mt-1 typo-caption text-slate-500 dark:text-slate-400">{monthlyEquivalentText}</p>
      )}

      <ul className="mt-5 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 typo-body-sm text-slate-700 dark:text-slate-200">
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto shrink-0 pt-6">
        <Button
          variant={isPrimaryCta ? 'primary' : 'secondary'}
          className={`w-full rounded-lg ${
            isPrimaryCta
              ? 'bg-ep-primary text-white hover:bg-ep-primary-accent dark:bg-ep-primary dark:hover:bg-ep-primary'
              : 'border border-slate-300 bg-white !text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 dark:hover:bg-slate-600'
          }`}
          onClick={onSubscribe}
          loading={showButtonLoading}
          disabled={blockInteraction}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  )
}
