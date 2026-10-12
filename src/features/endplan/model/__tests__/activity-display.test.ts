import test from 'node:test'
import assert from 'node:assert/strict'

import {
  activitySummaryItemLabel,
  isVisibleRecentActivityItem,
  resolveActivityTagKind,
  resolveActivityTimestamp,
} from '../activity-display.ts'

test('resolveActivityTimestamp uses Today with clock time on the same calendar day', () => {
  const now = new Date(2026, 7, 25, 18, 0, 0)
  const created = new Date(2026, 7, 25, 14, 5, 0)

  assert.deepEqual(resolveActivityTimestamp(created.toISOString(), 'en', now), {
    kind: 'today',
    time: '2:05 PM',
  })
})

test('resolveActivityTimestamp uses Yesterday with clock time', () => {
  const now = new Date(2026, 7, 25, 10, 0, 0)
  const created = new Date(2026, 7, 24, 7, 29, 0)

  assert.deepEqual(resolveActivityTimestamp(created.toISOString(), 'en', now), {
    kind: 'yesterday',
    time: '7:29 AM',
  })
})

test('resolveActivityTimestamp uses an absolute date and time for older events', () => {
  const now = new Date(2026, 7, 25, 10, 0, 0)
  const created = new Date(2026, 7, 11, 15, 0, 0)

  assert.deepEqual(resolveActivityTimestamp(created.toISOString(), 'en', now), {
    kind: 'absolute',
    label: 'Aug 11, 2026, 3:00 PM',
  })
})

test('resolveActivityTimestamp returns null for invalid dates', () => {
  assert.equal(resolveActivityTimestamp('not-a-date', 'en'), null)
})

test('resolveActivityTagKind maps section updates to Assets', () => {
  assert.equal(
    resolveActivityTagKind({
      action: 'vault_section.updated',
      metadata: { sectionType: 'assets' },
    }),
    'assets',
  )
})

test('resolveActivityTagKind maps policy section updates to Policies', () => {
  assert.equal(
    resolveActivityTagKind({
      action: 'vault_section.updated',
      metadata: { sectionType: 'policies' },
    }),
    'policies',
  )
})

test('resolveActivityTagKind maps invitations to Trusted Circle', () => {
  assert.equal(
    resolveActivityTagKind({
      action: 'invitation.sent',
      metadata: { inviteeEmail: 'ada@example.com' },
    }),
    'trustedCircle',
  )
})

test('activitySummaryItemLabel prefers a specific item label when present', () => {
  assert.equal(
    activitySummaryItemLabel({ itemLabel: 'Fidelity Bank shares', fileName: 'statement.pdf' }),
    'Fidelity Bank shares',
  )
})

test('isVisibleRecentActivityItem hides videos section events', () => {
  assert.equal(
    isVisibleRecentActivityItem({
      metadata: { sectionType: 'videos' },
    }),
    false,
  )
  assert.equal(
    isVisibleRecentActivityItem({
      metadata: { section_type: 'Videos' },
    }),
    false,
  )
  assert.equal(
    isVisibleRecentActivityItem({
      metadata: { sectionType: 'assets' },
    }),
    true,
  )
  assert.equal(isVisibleRecentActivityItem({ metadata: { vaultName: 'My EndPlan' } }), true)
})
