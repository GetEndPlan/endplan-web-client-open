import test from 'node:test'
import assert from 'node:assert/strict'

import type { InstructionItem } from '../instructions.ts'
import {
  blankInstructionFormState,
  formatInstructionRelativeUpdatedLabel,
  formatInstructionUpdatedLabel,
  instructionItemToFormState,
} from '../instructions-form-state.ts'

test('blankInstructionFormState returns a writable-note shape with one empty step', () => {
  const state = blankInstructionFormState()
  assert.equal(state.title, '')
  assert.equal(state.instructionType, 'written_note')
  assert.equal(state.noteBody, '')
  assert.equal(state.linkedAssetIds.length, 0)
  assert.equal(state.attachedDocumentId, null)
  assert.equal(state.linkedContactId, null)
  assert.equal(state.steps.length, 1)
  assert.equal(state.steps[0]?.text, '')
  assert.equal(state.steps[0]?.title, '')
  assert.match(state.steps[0]?.id ?? '', /^[0-9a-f-]{36}$/i)
})

test('instructionItemToFormState maps fields and adds a step when none exist', () => {
  const item: InstructionItem = {
    id: 'inst-1',
    title: 'T',
    instructionType: 'written_note',
    noteBody: 'N',
    steps: [],
    linkedAssetIds: ['a1'],
    attachedDocumentId: 'doc-1',
    linkedContactId: 'contact-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
  const state = instructionItemToFormState(item)
  assert.equal(state.id, 'inst-1')
  assert.equal(state.title, 'T')
  assert.equal(state.noteBody, 'N')
  assert.deepEqual(state.linkedAssetIds, ['a1'])
  assert.equal(state.attachedDocumentId, 'doc-1')
  assert.equal(state.linkedContactId, 'contact-1')
  assert.equal(state.steps.length, 1)
  assert.equal(state.steps[0]?.text, '')
  assert.equal(state.steps[0]?.title, '')
})

test('instructionItemToFormState preserves existing steps', () => {
  const item: InstructionItem = {
    id: 'inst-2',
    title: '',
    instructionType: 'written_note',
    noteBody: '',
    steps: [
      { id: 's1', title: 'A', text: 'one' },
      { id: 's2', title: '', text: 'two' },
    ],
    linkedAssetIds: [],
    attachedDocumentId: null,
    linkedContactId: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
  const state = instructionItemToFormState(item)
  assert.deepEqual(state.steps, item.steps)
})

test('formatInstructionUpdatedLabel returns empty for invalid dates', () => {
  assert.equal(formatInstructionUpdatedLabel('not-a-date'), '')
})

test('formatInstructionUpdatedLabel formats a valid ISO timestamp', () => {
  const out = formatInstructionUpdatedLabel('2024-06-15T12:00:00.000Z')
  assert.ok(out.length > 0)
  assert.match(out, /2024/)
})

test('formatInstructionRelativeUpdatedLabel returns just now for recent timestamps', () => {
  const now = Date.parse('2024-06-15T12:00:00.000Z')
  const t = (key: string) =>
    key === 'vault.instructions.relative.justNow' ? 'Just now' : key

  assert.equal(
    formatInstructionRelativeUpdatedLabel('2024-06-15T11:59:30.000Z', t, now),
    'Just now',
  )
})

test('formatInstructionRelativeUpdatedLabel uses minute and hour buckets', () => {
  const now = Date.parse('2024-06-15T12:00:00.000Z')
  const t = (key: string, options?: Record<string, unknown>) => {
    if (key === 'vault.instructions.relative.minutesAgo') {
      return `${String(options?.count)}m`
    }
    if (key === 'vault.instructions.relative.hoursAgo') {
      return `${String(options?.count)}h`
    }
    return key
  }

  assert.equal(
    formatInstructionRelativeUpdatedLabel('2024-06-15T11:45:00.000Z', t, now),
    '15m',
  )
  assert.equal(
    formatInstructionRelativeUpdatedLabel('2024-06-15T09:00:00.000Z', t, now),
    '3h',
  )
})
