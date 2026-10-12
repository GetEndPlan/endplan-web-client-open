import type { AssetSectionPayloadV2 } from './asset-table-model'

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, canonicalize(val)])
    return Object.fromEntries(entries)
  }
  return value
}

export function hashAssetPayload(payload: AssetSectionPayloadV2): string {
  const canonical = canonicalize(payload)
  return JSON.stringify(canonical)
}

export const hashPolicyPayload = hashAssetPayload
