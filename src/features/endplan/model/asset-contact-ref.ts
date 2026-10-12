import type { AssetSchemaCategory } from '../api/clients/vault-api'

export const ASSET_CONTACT_FIELD_TYPE = 'contact' as const
export const ASSET_CONTACT_LINK_KIND = 'vault_contact_link' as const
const ASSET_CONTACT_LINK_VERSION = 1 as const

export type AssetContactLinkRef = {
  kind: typeof ASSET_CONTACT_LINK_KIND
  v: typeof ASSET_CONTACT_LINK_VERSION
  contactId: string
  displayName?: string | null
}

export type ParsedAssetContactCellValue =
  | { kind: 'empty' }
  | { kind: 'contact_link'; reference: AssetContactLinkRef }

export type AssetContactOption = {
  id: string
  label: string
  subtitle: string
}

export function getContactFieldKeysByCategory(
  categories: AssetSchemaCategory[],
): Record<string, Set<string>> {
  return Object.fromEntries(
    categories.map((category) => [
      category.id,
      new Set(
        (category.fields ?? [])
          .filter((field) => field.fieldType === ASSET_CONTACT_FIELD_TYPE)
          .map((field) => field.key),
      ),
    ]),
  )
}

function parseContactLinkRef(rawValue: string): AssetContactLinkRef | null {
  const trimmed = rawValue.trim()
  if (!trimmed.startsWith('{')) return null

  try {
    const parsed = JSON.parse(trimmed) as Partial<AssetContactLinkRef>
    if (parsed.kind !== ASSET_CONTACT_LINK_KIND) return null
    if (parsed.v !== ASSET_CONTACT_LINK_VERSION) return null
    if (typeof parsed.contactId !== 'string' || parsed.contactId.trim() === '') return null
    if (parsed.displayName != null && typeof parsed.displayName !== 'string') return null
    return {
      kind: ASSET_CONTACT_LINK_KIND,
      v: ASSET_CONTACT_LINK_VERSION,
      contactId: parsed.contactId,
      displayName: parsed.displayName ?? null,
    }
  } catch {
    return null
  }
}

export function parseAssetContactCellValue(rawValue: string): ParsedAssetContactCellValue {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return { kind: 'empty' }
  }

  const contactLink = parseContactLinkRef(trimmed)
  if (contactLink) {
    return { kind: 'contact_link', reference: contactLink }
  }

  // Legacy / bare contact id fallback
  return {
    kind: 'contact_link',
    reference: {
      kind: ASSET_CONTACT_LINK_KIND,
      v: ASSET_CONTACT_LINK_VERSION,
      contactId: trimmed,
      displayName: null,
    },
  }
}

export function serializeContactLinkRef(input: {
  contactId: string
  displayName?: string | null
}): string {
  return JSON.stringify({
    kind: ASSET_CONTACT_LINK_KIND,
    v: ASSET_CONTACT_LINK_VERSION,
    contactId: input.contactId,
    displayName: input.displayName ?? null,
  } satisfies AssetContactLinkRef)
}

export function resolveAssetContactCellLabel(
  rawValue: string,
  contactsById: Record<string, AssetContactOption>,
): string | null {
  const parsed = parseAssetContactCellValue(rawValue)
  if (parsed.kind === 'empty') return null
  const live = contactsById[parsed.reference.contactId]
  return live?.label ?? parsed.reference.displayName ?? null
}
