export type AppVariantId = 'default' | 'sys'

export type AppVariantConfig = {
  id: AppVariantId
  showExportPdfButton: boolean
}

/** Optional hostname that selects the sys skin. Unset means the default skin only. */
export const SYS_DEMO_HOST = (import.meta.env?.VITE_SYS_DEMO_HOST ?? '').trim().toLowerCase()

const VARIANTS: Record<AppVariantId, AppVariantConfig> = {
  default: {
    id: 'default',
    showExportPdfButton: false,
  },
  sys: {
    id: 'sys',
    showExportPdfButton: true,
  },
}

export function resolveAppVariant(hostname: string, sysHost = SYS_DEMO_HOST): AppVariantConfig {
  const configured = sysHost.trim().toLowerCase()
  const normalized = hostname.trim().toLowerCase()
  if (configured && normalized === configured) {
    return VARIANTS.sys
  }
  return VARIANTS.default
}

export function getAppVariantConfig(id: AppVariantId): AppVariantConfig {
  return VARIANTS[id]
}

export function parseAppVariantId(value: string | null | undefined): AppVariantId | null {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'sys' || normalized === 'default') {
    return normalized
  }
  return null
}

/**
 * Sets document title and favicon for the active variant.
 * Safe to call from app bootstrap; replaces any existing icon links.
 */
export function applyAppVariantDocumentChrome(variantId: AppVariantId): void {
  if (typeof document === 'undefined') return

  const isSys = variantId === 'sys'
  document.title = isSys ? 'SYS | EndPlan' : 'EndPlan'

  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach((node) => node.remove())

  const addIcon = (rel: string, href: string, attrs?: Record<string, string>) => {
    const link = document.createElement('link')
    link.rel = rel
    link.href = href
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        link.setAttribute(key, value)
      }
    }
    document.head.appendChild(link)
  }

  addIcon('icon', '/favicon.svg', { type: 'image/svg+xml' })
  addIcon('apple-touch-icon', '/favicon.svg')
}
