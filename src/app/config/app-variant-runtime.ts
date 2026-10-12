import {
  getAppVariantConfig,
  parseAppVariantId,
  resolveAppVariant,
  type AppVariantConfig,
  type AppVariantId,
} from './app-variant'

const VARIANT_OVERRIDE_STORAGE_KEY = 'endplan-app-variant-override'
const VARIANT_OVERRIDE_QUERY_PARAM = 'appVariant'

/** Brand-only override for local development; never active in production builds. */
const isVariantOverrideEnabled = import.meta.env.DEV

function readStoredVariantOverride(): AppVariantId | null {
  if (!isVariantOverrideEnabled || typeof window === 'undefined') return null
  try {
    return parseAppVariantId(window.localStorage.getItem(VARIANT_OVERRIDE_STORAGE_KEY))
  } catch {
    return null
  }
}

/**
 * Reads `?appVariant=sys|default|reset` in dev and persists it, so both brand
 * variants can be previewed on localhost without changing hosts.
 */
export function syncAppVariantOverrideFromUrl(): void {
  if (!isVariantOverrideEnabled || typeof window === 'undefined') return

  const requested = new URLSearchParams(window.location.search).get(VARIANT_OVERRIDE_QUERY_PARAM)
  if (requested === null) return

  try {
    const parsed = parseAppVariantId(requested)
    if (parsed) {
      window.localStorage.setItem(VARIANT_OVERRIDE_STORAGE_KEY, parsed)
    } else {
      window.localStorage.removeItem(VARIANT_OVERRIDE_STORAGE_KEY)
    }
  } catch {
    // Storage can be unavailable (private mode); fall back to host-based branding.
  }
}

export function resolveActiveAppVariant(): AppVariantConfig {
  if (typeof window === 'undefined') return resolveAppVariant('')

  const override = readStoredVariantOverride()
  return override ? getAppVariantConfig(override) : resolveAppVariant(window.location.hostname)
}
