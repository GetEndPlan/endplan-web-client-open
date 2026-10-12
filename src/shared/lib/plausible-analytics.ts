import {
  init as initPlausibleTracker,
  track as plausibleTrack,
  type PlausibleConfig,
  type PlausibleEventOptions,
  type PlausibleRequestPayload,
} from '@plausible-analytics/tracker'
import { scrubAnalyticsUrl } from './scrub-analytics-url'

export type { PlausibleEventOptions } from '@plausible-analytics/tracker'
export { scrubAnalyticsUrl } from './scrub-analytics-url'

function resolvePlausibleDomain(): string | null {
  const v = import.meta.env.VITE_PLAUSIBLE_DOMAIN
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : null
}

let initialized = false

const plausibleEnabledInDev = import.meta.env.VITE_PLAUSIBLE_ENABLE_IN_DEV === 'true'

function shouldInitPlausible(): boolean {
  return import.meta.env.PROD || plausibleEnabledInDev
}

function transformPlausibleRequest(payload: PlausibleRequestPayload): PlausibleRequestPayload | null {
  return {
    ...payload,
    u: scrubAnalyticsUrl(payload.u),
  }
}

/**
 * Initializes Plausible once when `VITE_PLAUSIBLE_DOMAIN` is set. Runs in production
 * builds, or in dev when `VITE_PLAUSIBLE_ENABLE_IN_DEV=true` (sets captureOnLocalhost).
 * SPA pageviews use history API hooks from the tracker.
 */
export function initPlausibleAnalytics(): void {
  if (initialized || typeof window === 'undefined') return
  if (!shouldInitPlausible()) return

  const domain = resolvePlausibleDomain()
  if (!domain) return

  const config: PlausibleConfig = {
    domain,
    captureOnLocalhost: plausibleEnabledInDev,
    transformRequest: transformPlausibleRequest,
  }
  initPlausibleTracker(config)
  initialized = true
}

/**
 * Sends a custom event. No-op when analytics is not initialized.
 * Do not pass PII, auth tokens, vault material, or free-form error text in props.
 */
export function trackPlausibleEvent(
  eventName: string,
  options: PlausibleEventOptions = {},
): void {
  if (!initialized) return
  plausibleTrack(eventName, options)
}
