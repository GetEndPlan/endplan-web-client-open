import { isVisibleVaultSectionType } from './vault-section-types'

const SECTION_TYPE_ALIASES: Record<string, string> = {
  asset: 'assets',
  policy: 'policies',
  policies: 'policies',
  assets: 'assets',
  document: 'documents',
  documents: 'documents',
  file: 'documents',
  files: 'documents',
  instruction: 'instructions',
  instructions: 'instructions',
  contact: 'contacts',
  contacts: 'contacts',
}

const SECTION_TAG_KINDS = new Set(['assets', 'policies', 'documents', 'instructions', 'contacts'])

const TRUSTED_CIRCLE_ACTIONS = new Set([
  'access.granted',
  'access.revoked',
  'invitation.sent',
  'invitation.released',
  'invitation.accepted',
  'invitation.declined',
  'invitation.cancelled',
  'trusted_circle.member_added',
  'trusted_circle.member_updated',
  'trusted_circle.member_removed',
])

const ENDPLAN_ACTIONS = new Set(['vault.created', 'vault.updated', 'vault.deleted'])

const ITEM_LABEL_KEYS = ['itemLabel', 'itemName', 'fileName'] as const

export type ActivityTagKind =
  | 'assets'
  | 'policies'
  | 'documents'
  | 'instructions'
  | 'contacts'
  | 'trustedCircle'
  | 'endPlan'

export type ActivityTimestamp =
  | { kind: 'today'; time: string }
  | { kind: 'yesterday'; time: string }
  | { kind: 'absolute'; label: string }

export function activityMetaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function activityMetaNumber(
  metadata: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  const value = metadata?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export function normalizeActivitySectionType(sectionType: string): string {
  const normalized = sectionType.trim().toLowerCase()
  return SECTION_TYPE_ALIASES[normalized] ?? normalized
}

const ACTIVITY_SECTION_TYPE_META_KEYS = ['sectionType', 'section_type'] as const

export function activitySectionTypeFromMetadata(
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  for (const key of ACTIVITY_SECTION_TYPE_META_KEYS) {
    const value = activityMetaString(metadata, key)
    if (value) return normalizeActivitySectionType(value)
  }
  return undefined
}

export function isVisibleRecentActivityItem(item: {
  entityType?: string
  metadata?: Record<string, unknown>
}): boolean {
  const sectionType = activitySectionTypeFromMetadata(item.metadata)
  if (sectionType && !isVisibleVaultSectionType(sectionType)) {
    return false
  }
  if (item.entityType && !isVisibleVaultSectionType(normalizeActivitySectionType(item.entityType))) {
    return false
  }
  return true
}

export function activitySummaryItemLabel(
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  for (const key of ITEM_LABEL_KEYS) {
    const value = activityMetaString(metadata, key)
    if (value) return value
  }
  return undefined
}

export function resolveActivityTagKind(input: {
  action: string
  metadata?: Record<string, unknown>
}): ActivityTagKind | null {
  const sectionType = activityMetaString(input.metadata, 'sectionType')
  if (sectionType) {
    const normalized = normalizeActivitySectionType(sectionType)
    if (SECTION_TAG_KINDS.has(normalized)) {
      return normalized as ActivityTagKind
    }
  }

  if (ENDPLAN_ACTIONS.has(input.action)) {
    return 'endPlan'
  }

  if (TRUSTED_CIRCLE_ACTIONS.has(input.action)) {
    return 'trustedCircle'
  }

  return null
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function calendarDayDiff(from: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((startOfLocalDay(now) - startOfLocalDay(from)) / msPerDay)
}

function normalizeLocaleClockText(value: string): string {
  return value.replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ')
}

function formatClockTime(date: Date, locale: string): string {
  return normalizeLocaleClockText(
    date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  )
}

function formatAbsoluteTimestamp(date: Date, locale: string): string {
  return normalizeLocaleClockText(
    date.toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  )
}

export function resolveActivityTimestamp(
  iso: string,
  locale: string,
  now: Date = new Date(),
): ActivityTimestamp | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const dayDiff = calendarDayDiff(date, now)
  if (dayDiff === 0) {
    return { kind: 'today', time: formatClockTime(date, locale) }
  }
  if (dayDiff === 1) {
    return { kind: 'yesterday', time: formatClockTime(date, locale) }
  }

  return { kind: 'absolute', label: formatAbsoluteTimestamp(date, locale) }
}
