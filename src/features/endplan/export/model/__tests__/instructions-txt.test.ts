import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildInstructionsTxt } from '../instructions-txt.ts'

const copy = {
  untitledInstruction: 'Untitled instruction',
  untitledAsset: 'Untitled asset',
  untitledContact: 'Untitled contact',
  untitledDocument: 'Untitled file',
  writtenNoteType: 'Written note',
  stepByStepType: 'Step-by-step',
  relatedHeading: 'Related',
  relatedContact: 'Contact',
  relatedDocument: 'Document',
  relatedAssets: 'Assets',
}

describe('buildInstructionsTxt', () => {
  it('formats written notes, steps, and related names', () => {
    const text = buildInstructionsTxt({
      payload: {
        schemaVersion: 1,
        items: [
          {
            id: 'i1',
            title: 'House',
            instructionType: 'written_note',
            noteBody: 'Keep the spare key with Jane.',
            steps: [],
            linkedAssetIds: ['a1'],
            attachedDocumentId: 'd1',
            linkedContactId: 'c1',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'i2',
            title: 'Accounts',
            instructionType: 'step_by_step',
            noteBody: '',
            steps: [
              { id: 's1', title: 'Open the vault', text: 'Use the recovery key.' },
              { id: 's2', title: '', text: 'Call the bank.' },
            ],
            linkedAssetIds: [],
            attachedDocumentId: null,
            linkedContactId: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      copy,
      contactsById: { c1: { fullName: 'Jane Doe' } },
      documentNamesById: { d1: 'deed.pdf' },
      assetsPayload: {
        schemaVersion: 2,
        categories: [
          {
            categoryTemplateId: 'cat',
            rows: [{ id: 'a1', values: { asset_name: 'Family home' } }],
          },
        ],
      },
    })

    assert.match(text, /1\. House/)
    assert.match(text, /Written note/)
    assert.match(text, /Keep the spare key with Jane\./)
    assert.match(text, /Contact: Jane Doe/)
    assert.match(text, /Document: deed.pdf/)
    assert.match(text, /Assets: Family home/)
    assert.match(text, /2\. Accounts/)
    assert.match(text, /1\. Open the vault/)
    assert.match(text, /2\. Call the bank\./)
  })
})
