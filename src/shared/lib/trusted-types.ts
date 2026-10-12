import { sanitizeUntrustedHtml } from './sanitize.ts'

type TrustedTypesLike = {
  createPolicy: (
    name: string,
    rules: {
      createHTML?: (input: string) => string
      createScript?: (_input: string) => string
      createScriptURL?: (_input: string) => string
    },
  ) => unknown
}

type TrustedTypesWindow = {
  trustedTypes?: TrustedTypesLike
}

const POLICY_NAME = 'endplan'
let installedPolicy = false

/**
 * Installs a Trusted Types policy when the browser supports it.
 * Safe to call multiple times.
 */
export function installTrustedTypesPolicy(globalObject?: TrustedTypesWindow): void {
  if (installedPolicy) return

  const target = globalObject ?? (typeof window !== 'undefined' ? (window as TrustedTypesWindow) : undefined)
  const trustedTypes = target?.trustedTypes

  if (!trustedTypes?.createPolicy) {
    installedPolicy = true
    return
  }

  try {
    trustedTypes.createPolicy(POLICY_NAME, {
      createHTML: (input: string) => sanitizeUntrustedHtml(input),
      createScript: () => {
        throw new TypeError('Script creation is not allowed by trusted types policy')
      },
      createScriptURL: () => {
        throw new TypeError('Script URL creation is not allowed by trusted types policy')
      },
    })
  } catch {
    // Policy may already exist or browser may reject duplicate names.
  } finally {
    installedPolicy = true
  }
}

export function __resetTrustedTypesPolicyForTests(): void {
  installedPolicy = false
}
