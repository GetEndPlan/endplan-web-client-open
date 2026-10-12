import { TextLinkButton, EndPlanIcon, type EndPlanIconName } from '@/shared/ui'
import { formatDate, cn } from '@/shared/lib'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import type { ActivityLogItem } from '../../api/clients/activity-api'
import {
  activityMetaNumber,
  activityMetaString,
  activitySummaryItemLabel,
  isVisibleRecentActivityItem,
  normalizeActivitySectionType,
  resolveActivityTagKind,
  resolveActivityTimestamp,
  type ActivityTagKind,
} from '../../model/activity-display'

type RecentActivityCardProps = {
  activity: ActivityLogItem[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  className?: string
}

type ActivityStyle = {
  icon: EndPlanIconName
  title: string
  tagKind: ActivityTagKind | null
}

const ACTIVITY_PREFIX = 'dashboard.recentActivity'

function formatTrustedCircleRole(t: TFunction, role: string | undefined): string | undefined {
  if (!role) return undefined
  const key = `trustedCircle.roles.${role}`
  const translated = t(key, { defaultValue: '' })
  return translated.length > 0 ? translated : role
}

function formatSectionNoun(t: TFunction, sectionType: string | undefined): string | undefined {
  if (!sectionType) return undefined
  const normalized = normalizeActivitySectionType(sectionType)
  if (!isVisibleRecentActivityItem({ metadata: { sectionType: normalized } })) {
    return undefined
  }
  const translated = t(`${ACTIVITY_PREFIX}.sectionNouns.${normalized}`, { defaultValue: '' })
  return translated.length > 0 ? translated : undefined
}

function invitationTitle(
  t: TFunction,
  baseKey: string,
  email: string | undefined,
  fallbackKey: 'title',
): string {
  if (email) {
    return t(`${baseKey}.titleEmail`, { email })
  }
  return t(`${baseKey}.${fallbackKey}`)
}

function roleTitle(
  t: TFunction,
  baseKey: string,
  role: string | undefined,
  fallbackKey: 'title',
): string {
  if (role) {
    return t(`${baseKey}.titleRole`, { role })
  }
  return t(`${baseKey}.${fallbackKey}`)
}

function formatActivityTimestampLabel(t: TFunction, iso: string, locale: string): string {
  const resolved = resolveActivityTimestamp(iso, locale)
  if (!resolved) return formatDate(iso)
  if (resolved.kind === 'today') {
    return t(`${ACTIVITY_PREFIX}.timestamp.today`, { time: resolved.time })
  }
  if (resolved.kind === 'yesterday') {
    return t(`${ACTIVITY_PREFIX}.timestamp.yesterday`, { time: resolved.time })
  }
  return resolved.label
}

function sectionIcon(sectionType: string | undefined): EndPlanIconName {
  if (!sectionType) return 'file'
  const normalized = normalizeActivitySectionType(sectionType)
  if (normalized === 'assets') return 'assets'
  if (normalized === 'documents') return 'documents'
  if (normalized === 'contacts') return 'contact'
  return 'file'
}

function sectionActionTitle(
  t: TFunction,
  action: 'created' | 'updated' | 'deleted',
  sectionNoun: string | undefined,
  itemLabel: string | undefined,
): string {
  if (itemLabel) {
    return t(`${ACTIVITY_PREFIX}.section.${action}.titleWithItem`, { item: itemLabel })
  }
  if (sectionNoun) {
    return t(`${ACTIVITY_PREFIX}.section.${action}.titleWithSection`, { section: sectionNoun })
  }
  return t(`${ACTIVITY_PREFIX}.section.${action}.titleFallback`)
}

type ActivityTitleSegment = {
  text: string
  emphasize: boolean
}

function buildActivityTitleSegments(
  title: string,
  metadata: Record<string, unknown> | undefined,
): ActivityTitleSegment[] {
  const emphasisTerms = new Set<string>()

  if (title.startsWith('You') || title.startsWith('Vous')) {
    emphasisTerms.add(title.startsWith('Vous') ? 'Vous' : 'You')
  }

  const vaultName = activityMetaString(metadata, 'vaultName')
  if (vaultName) {
    emphasisTerms.add(vaultName)
  }

  const itemLabel = activitySummaryItemLabel(metadata)
  if (itemLabel) {
    emphasisTerms.add(itemLabel)
  }

  const inviteeEmail = activityMetaString(metadata, 'inviteeEmail')
  if (inviteeEmail) {
    emphasisTerms.add(inviteeEmail)
    const localPart = inviteeEmail.split('@')[0]?.trim()
    if (localPart) {
      emphasisTerms.add(localPart)
    }
  }

  const sortedTerms = [...emphasisTerms].sort((a, b) => b.length - a.length)
  if (sortedTerms.length === 0) {
    return [{ text: title, emphasize: false }]
  }

  const segments: ActivityTitleSegment[] = []
  let cursor = 0

  while (cursor < title.length) {
    let nextMatch: { index: number; term: string } | null = null

    for (const term of sortedTerms) {
      const index = title.indexOf(term, cursor)
      if (index === -1) continue
      if (!nextMatch || index < nextMatch.index || (index === nextMatch.index && term.length > nextMatch.term.length)) {
        nextMatch = { index, term }
      }
    }

    if (!nextMatch) {
      segments.push({ text: title.slice(cursor), emphasize: false })
      break
    }

    if (nextMatch.index > cursor) {
      segments.push({ text: title.slice(cursor, nextMatch.index), emphasize: false })
    }

    segments.push({ text: nextMatch.term, emphasize: true })
    cursor = nextMatch.index + nextMatch.term.length
  }

  return segments.length > 0 ? segments : [{ text: title, emphasize: false }]
}

function ActivityTitle({
  title,
  metadata,
}: {
  title: string
  metadata: Record<string, unknown> | undefined
}) {
  const segments = buildActivityTitleSegments(title, metadata)

  return (
    <p className="min-w-0 typo-body-sm text-ep-body dark:text-white lg:typo-body">
      {segments.map((segment, index) =>
        segment.emphasize ? (
          <span key={`${segment.text}-${index}`} className="typo-emphasis">
            {segment.text}
          </span>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        ),
      )}
    </p>
  )
}

function ActivityTag({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-ep-primary-softer px-2 py-0.5 typo-badge text-ep-primary dark:bg-ep-primary/20 dark:text-ep-primary-soft">
      {label}
    </span>
  )
}

function getActivityStyle(t: TFunction, item: ActivityLogItem): ActivityStyle {
  const metadata = item.metadata
  const vaultName = activityMetaString(metadata, 'vaultName')
  const sectionType = activityMetaString(metadata, 'sectionType')
  const sectionNoun = formatSectionNoun(t, sectionType)
  const itemLabel = activitySummaryItemLabel(metadata)
  const role = formatTrustedCircleRole(t, activityMetaString(metadata, 'role'))
  const inviteeEmail = activityMetaString(metadata, 'inviteeEmail')
  const releasedCount = activityMetaNumber(metadata, 'released')
  const isBulkRelease = metadata?.bulk === true
  const tagKind = resolveActivityTagKind(item)

  switch (item.action) {
    case 'vault.created':
      return {
        icon: 'vault',
        title: t(`${ACTIVITY_PREFIX}.vault.created.title`),
        tagKind,
      }
    case 'vault.updated':
      return {
        icon: 'time',
        title: vaultName
          ? t(`${ACTIVITY_PREFIX}.vault.updated.titleVaultName`, { vaultName })
          : t(`${ACTIVITY_PREFIX}.vault.updated.title`),
        tagKind,
      }
    case 'vault.deleted':
      return {
        icon: 'vault',
        title: vaultName
          ? t(`${ACTIVITY_PREFIX}.vault.deleted.titleVaultName`, { vaultName })
          : t(`${ACTIVITY_PREFIX}.vault.deleted.title`),
        tagKind,
      }
    case 'vault_section.created':
      return {
        icon: sectionIcon(sectionType),
        title: sectionActionTitle(t, 'created', sectionNoun, itemLabel),
        tagKind,
      }
    case 'vault_section.updated':
      return {
        icon: sectionIcon(sectionType),
        title: sectionActionTitle(t, 'updated', sectionNoun, itemLabel),
        tagKind,
      }
    case 'vault_section.deleted':
      return {
        icon: sectionIcon(sectionType),
        title: sectionActionTitle(t, 'deleted', sectionNoun, itemLabel),
        tagKind,
      }
    case 'access.granted':
      return {
        icon: 'security',
        title: roleTitle(t, `${ACTIVITY_PREFIX}.access.granted`, role, 'title'),
        tagKind,
      }
    case 'access.revoked':
      return {
        icon: 'security',
        title: roleTitle(t, `${ACTIVITY_PREFIX}.access.revoked`, role, 'title'),
        tagKind,
      }
    case 'invitation.sent':
      return {
        icon: 'key-person',
        title: invitationTitle(t, `${ACTIVITY_PREFIX}.invitation.sent`, inviteeEmail, 'title'),
        tagKind,
      }
    case 'invitation.released':
      if (isBulkRelease && releasedCount != null && releasedCount > 0) {
        return {
          icon: 'key-person',
          title: t(`${ACTIVITY_PREFIX}.invitation.releasedBulk.title`, { count: releasedCount }),
          tagKind,
        }
      }
      return {
        icon: 'key-person',
        title: invitationTitle(t, `${ACTIVITY_PREFIX}.invitation.released`, inviteeEmail, 'title'),
        tagKind,
      }
    case 'invitation.accepted':
      return {
        icon: 'check',
        title: roleTitle(t, `${ACTIVITY_PREFIX}.invitation.accepted`, role, 'title'),
        tagKind,
      }
    case 'invitation.declined':
      return {
        icon: 'check',
        title: roleTitle(t, `${ACTIVITY_PREFIX}.invitation.declined`, role, 'title'),
        tagKind,
      }
    case 'invitation.cancelled':
      return {
        icon: 'key-person',
        title: invitationTitle(t, `${ACTIVITY_PREFIX}.invitation.cancelled`, inviteeEmail, 'title'),
        tagKind,
      }
    case 'trusted_circle.member_added':
      return {
        icon: 'key-person',
        title: roleTitle(t, `${ACTIVITY_PREFIX}.trustedCircle.memberAdded`, role, 'title'),
        tagKind,
      }
    case 'trusted_circle.member_updated':
      return {
        icon: 'key-person',
        title: roleTitle(t, `${ACTIVITY_PREFIX}.trustedCircle.memberUpdated`, role, 'title'),
        tagKind,
      }
    case 'trusted_circle.member_removed':
      return {
        icon: 'key-person',
        title: roleTitle(t, `${ACTIVITY_PREFIX}.trustedCircle.memberRemoved`, role, 'title'),
        tagKind,
      }
    default:
      return {
        icon: 'file',
        title: t(`${ACTIVITY_PREFIX}.fallback.title`),
        tagKind,
      }
  }
}

export function RecentActivityCard({
  activity,
  isLoading = false,
  isError = false,
  onRetry,
  className,
}: RecentActivityCardProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language
  const visibleActivity = activity.filter(isVisibleRecentActivityItem)

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col rounded-ep-card border border-ep-border-card bg-ep-surface p-4',
        className,
      )}
    >
      <h2 className="typo-heading-section text-ep-body dark:text-white">
        {t(`${ACTIVITY_PREFIX}.cardTitle`)}
      </h2>
      <p className="mt-0.5 hidden typo-caption text-ep-body/60 dark:text-white/60 sm:block">
        {t(`${ACTIVITY_PREFIX}.cardSubtitle`)}
      </p>
      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <p className="py-2 text-center typo-body-sm text-ep-body/60 dark:text-white/50">
            {t(`${ACTIVITY_PREFIX}.loading`)}
          </p>
        ) : isError ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <p className="typo-body-sm text-ep-body/60 dark:text-white/50">{t(`${ACTIVITY_PREFIX}.error`)}</p>
            {onRetry ? (
              <TextLinkButton type="button" variant="caption" onClick={onRetry}>
                {t(`${ACTIVITY_PREFIX}.retry`)}
              </TextLinkButton>
            ) : null}
          </div>
        ) : visibleActivity.length > 0 ? (
          <div className="space-y-3">
            {visibleActivity.map((item) => {
              const style = getActivityStyle(t, item)
              const tagLabel = style.tagKind
                ? t(`${ACTIVITY_PREFIX}.tags.${style.tagKind}`)
                : null
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-0.5"
                >
                  <EndPlanIcon name={style.icon} size={24} className="mt-0.5 size-6 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <ActivityTitle title={style.title} metadata={item.metadata} />
                      {tagLabel ? <ActivityTag label={tagLabel} /> : null}
                    </div>
                    <p className="mt-0.5 typo-caption text-ep-body/50 dark:text-white/50">
                      {formatActivityTimestampLabel(t, item.createdAt, locale)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-0.5 py-2 text-center">
            <p className="typo-body-sm text-ep-body/60 dark:text-white/50">{t(`${ACTIVITY_PREFIX}.empty`)}</p>
            <p className="typo-caption text-ep-body/40 dark:text-white/40">{t(`${ACTIVITY_PREFIX}.emptyHint`)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
