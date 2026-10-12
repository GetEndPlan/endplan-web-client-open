export type ContactRole =
  | 'lawyer'
  | 'doctor'
  | 'financial_manager'
  | 'power_of_attorney'
  | 'other'

export const CONTACT_ROLES: readonly ContactRole[] = [
  'lawyer',
  'doctor',
  'financial_manager',
  'power_of_attorney',
  'other',
] as const

/** Roles surfaced as "People to consider" suggestions in the empty/list states. */
export const CONTACT_ROLE_SUGGESTIONS: readonly ContactRole[] = [
  'lawyer',
  'doctor',
  'financial_manager',
  'power_of_attorney',
] as const

export type ContactItem = {
  id: string
  fullName: string
  role: ContactRole
  /** Custom label shown when role === 'other'. */
  customRoleLabel: string
  phone: string
  email: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ContactsSectionPayload = {
  schemaVersion: number
  items: ContactItem[]
}

/** Editable fields captured by the add/edit modal. */
export type ContactFormInput = {
  id?: string
  fullName: string
  role: ContactRole
  customRoleLabel: string
  phone: string
  email: string
  notes: string
}

/** Role filter value for the list panel; `all` shows every contact. */
export type ContactRoleFilter = ContactRole | 'all'

export type ContactUpsertResult =
  | { success: true; savedContactId: string }
  | { success: false }

export function emptyContactsPayload(): ContactsSectionPayload {
  return { schemaVersion: 1, items: [] }
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normalizeRole(value: unknown): ContactRole {
  return CONTACT_ROLES.includes(value as ContactRole) ? (value as ContactRole) : 'other'
}

export function normalizeContactsPayload(value: unknown): ContactsSectionPayload {
  const base = emptyContactsPayload()
  if (!value || typeof value !== 'object') return base
  const maybeItems = (value as { items?: unknown }).items
  if (!Array.isArray(maybeItems)) return base

  return {
    schemaVersion: 1,
    items: maybeItems
      .map((item): ContactItem | null => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const fullName = asString(record.fullName).trim()
        if (!fullName) return null
        const nowISO = new Date().toISOString()
        return {
          id: asString(record.id) || crypto.randomUUID(),
          fullName,
          role: normalizeRole(record.role),
          customRoleLabel: asString(record.customRoleLabel),
          phone: asString(record.phone),
          email: asString(record.email),
          notes: asString(record.notes),
          createdAt: asString(record.createdAt) || nowISO,
          updatedAt: asString(record.updatedAt) || nowISO,
        }
      })
      .filter((item): item is ContactItem => item != null),
  }
}

/** Resolve the human-readable role label, honoring a custom label for `other`. */
export function contactRoleDisplayLabel(
  contact: Pick<ContactItem, 'role' | 'customRoleLabel'>,
  roleLabels: Record<ContactRole, string>,
): string {
  if (contact.role === 'other') {
    const custom = contact.customRoleLabel.trim()
    if (custom) return custom
  }
  return roleLabels[contact.role]
}

export function contactInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase()
}
