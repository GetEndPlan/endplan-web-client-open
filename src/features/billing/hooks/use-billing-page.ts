import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthUser } from '@/features/auth/session'
import {
  type BillingTier,
  type Product,
  useBillingProducts,
  useSubscription,
  useCreateCheckout,
  useCancelSubscription,
  useOpenPortal,
} from '../api/index'
import { toast } from '@/shared/ui'
import {
  shouldOpenBillingPortalForSubscribe,
  type BillingInterval,
} from '../model/plan-change'

function isTierProduct(product: Product, tier: BillingTier) {
  return product.tier === tier || product.name.toLowerCase().includes(tier)
}

export function useBillingPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuthUser()
  const queryEnabled = !!user

  const { data: products = [], isLoading: isLoadingProducts } = useBillingProducts({ enabled: queryEnabled })
  const { data: subscriptionResponse, isLoading: isLoadingSubscription } = useSubscription({ enabled: queryEnabled })
  const createCheckoutMutation = useCreateCheckout()
  const cancelSubscriptionMutation = useCancelSubscription()
  const openPortalMutation = useOpenPortal()

  const subscription = subscriptionResponse?.subscription ?? null
  const hasActiveSubscription = subscriptionResponse?.hasActiveSubscription ?? false
  const inTrial = subscriptionResponse?.inTrial ?? false
  const trialEndsAt = subscriptionResponse?.trialEndsAt ?? null
  const canAccess = subscriptionResponse?.canAccess ?? true
  const keyPersonBillingPendingAck = subscriptionResponse?.keyPersonBillingPendingAck === true

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const handleSubscribe = async (tier: BillingTier, interval: BillingInterval) => {
    if (shouldOpenBillingPortalForSubscribe(hasActiveSubscription, subscription, tier, interval)) {
      try {
        const url = await openPortalMutation.mutateAsync()
        toast.info(t('billing.notifications.portalRedirectForPlanChange'))
        window.location.href = url
      } catch {
        toast.error(t('billing.notifications.portalError'))
      }
      return
    }

    try {
      const { checkoutUrl } = await createCheckoutMutation.mutateAsync({ tier, interval })
      window.location.href = checkoutUrl
    } catch {
      toast.error(t('billing.notifications.checkoutError'))
    }
  }

  const handleManageSubscription = async () => {
    try {
      const url = await openPortalMutation.mutateAsync()
      window.location.href = url
    } catch {
      toast.error(t('billing.notifications.portalError'))
    }
  }

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscriptionMutation.mutateAsync()
      setShowCancelConfirm(false)
      toast.success(t('billing.notifications.cancelSuccess'))
    } catch {
      toast.error(t('billing.notifications.cancelError'))
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const basicMonthly = products.find((p) => p.tier === 'basic' && p.billingInterval === 'month')
  const basicYearly = products.find((p) => p.tier === 'basic' && p.billingInterval === 'year')
  const proMonthly = products.find((p) => p.tier === 'pro' && p.billingInterval === 'month')
  const proYearly = products.find((p) => p.tier === 'pro' && p.billingInterval === 'year')

  const basicMonthlyAlt = products.find((p) => p.billingInterval === 'month' && isTierProduct(p, 'basic'))
  const basicYearlyAlt = products.find((p) => p.billingInterval === 'year' && isTierProduct(p, 'basic'))
  const proMonthlyAlt = products.find((p) => p.billingInterval === 'month' && isTierProduct(p, 'pro'))
  const proYearlyAlt = products.find((p) => p.billingInterval === 'year' && isTierProduct(p, 'pro'))

  const basicMonthlyProduct = basicMonthly ?? basicMonthlyAlt
  const basicYearlyProduct = basicYearly ?? basicYearlyAlt
  const proMonthlyProduct = proMonthly ?? proMonthlyAlt
  const proYearlyProduct = proYearly ?? proYearlyAlt

  const basicYearlySavings = basicMonthlyProduct && basicYearlyProduct
    ? Math.round(((basicMonthlyProduct.priceAmount * 12 - basicYearlyProduct.priceAmount) / (basicMonthlyProduct.priceAmount * 12)) * 100)
    : 0

  const proYearlySavings = proMonthlyProduct && proYearlyProduct
    ? Math.round(((proMonthlyProduct.priceAmount * 12 - proYearlyProduct.priceAmount) / (proMonthlyProduct.priceAmount * 12)) * 100)
    : 0

  const isLoading = isLoadingProducts || isLoadingSubscription
  const isCreatingCheckout = createCheckoutMutation.isPending || openPortalMutation.isPending
  const isCanceling = cancelSubscriptionMutation.isPending

  return {
    user,
    subscription,
    hasActiveSubscription,
    inTrial,
    trialEndsAt,
    canAccess,
    keyPersonBillingPendingAck,
    isLoadingSubscription,
    showCancelConfirm,
    setShowCancelConfirm,
    handleSubscribe,
    handleManageSubscription,
    handleCancelSubscription,
    formatPrice,
    formatDate,
    basicMonthlyProduct,
    basicYearlyProduct,
    proMonthlyProduct,
    proYearlyProduct,
    basicYearlySavings,
    proYearlySavings,
    isLoading,
    isCreatingCheckout,
    isCanceling,
  }
}
