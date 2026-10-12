import { api } from '@/shared/api'

export type BillingTier = 'basic' | 'pro'

export type Product = {
  id: string
  name: string
  description?: string
  priceAmount: number
  priceCurrency: string
  billingInterval: 'month' | 'year'
  tier?: BillingTier
}

export type Subscription = {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'revoked' | 'trialing'
  tier?: BillingTier
  billingInterval: 'month' | 'year'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt?: string
}

/** Feature limits from the user's plan (subscription or trial) */
export type UserFeatures = {
  max_key_persons: number
  asset_categories_max: number
  asset_rows_per_category_max: number
  documents_folders_max: number
  documents_files_max: number
  documents_file_size_max_bytes: number
  documents_total_size_max_bytes: number
  instructions_max: number
  contacts_max: number
  policy_categories_max?: number
  policy_rows_per_category_max?: number
}

export type SubscriptionResponse = {
  subscription: Subscription | null
  hasActiveSubscription: boolean
  canAccess: boolean
  inTrial: boolean
  trialEndsAt: string | null
  /** Server-driven: key person must acknowledge free tier before normal trial UI */
  keyPersonBillingPendingAck?: boolean
  /** Active key person who used EndPlan on their own account before the invite */
  keyPersonEstablishedBeforeInvite?: boolean
  keyPersonBillingOwnerName?: string
  /** Plan limits; present when canAccess is true */
  features?: UserFeatures
}

export type ProductsResponse = {
  products: Product[]
}

export type CheckoutResponse = {
  checkoutUrl: string
  checkoutId: string
}

export type PortalResponse = {
  portalUrl: string
}

export type CancelResponse = {
  message: string
  canceledAt: string
  periodEnd: string
}

export const billingApi = {
  /**
   * Get available subscription products
   */
  async getProducts(): Promise<Product[]> {
    const response = await api.get<ProductsResponse>('/api/v1/billing/products')
    return response.products || []
  },

  /**
   * Get current subscription status
   */
  async getSubscription(): Promise<SubscriptionResponse> {
    return api.get<SubscriptionResponse>('/api/v1/billing/subscription')
  },

  /**
   * Create a checkout session
   * @param tier - 'basic' or 'pro' (defaults to 'basic' on API if omitted)
   * @param interval - 'monthly' or 'yearly'
   */
  async createCheckout(
    tier: BillingTier,
    interval: 'monthly' | 'yearly'
  ): Promise<CheckoutResponse> {
    return api.post<CheckoutResponse>('/api/v1/billing/checkout', { tier, interval })
  },

  /**
   * Get customer portal URL for managing subscription
   */
  async getPortalUrl(): Promise<string> {
    const response = await api.get<PortalResponse>('/api/v1/billing/portal')
    return response.portalUrl
  },

  /**
   * Cancel the current subscription
   */
  async cancelSubscription(): Promise<CancelResponse> {
    return api.post<CancelResponse>('/api/v1/billing/cancel', {})
  },

  async acknowledgeKeyPersonFree(): Promise<{ ok: boolean }> {
    // No request body: user id comes from the session cookie.
    return api.post<{ ok: boolean }>('/api/v1/billing/key-person/acknowledge-free')
  },
}
