import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getDocumentViewerCapability,
  toViewerFile,
} from '../document-viewer-capabilities.ts'

test('document viewer capability treats common inline formats as previewable', () => {
  assert.equal(getDocumentViewerCapability('application/pdf', 'report.pdf'), 'inline')
  assert.equal(
    getDocumentViewerCapability(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'letter.docx',
    ),
    'inline',
  )
  assert.equal(
    getDocumentViewerCapability(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'budget.xlsx',
    ),
    'inline',
  )
  assert.equal(
    getDocumentViewerCapability(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'deck.pptx',
    ),
    'inline',
  )
  assert.equal(getDocumentViewerCapability('text/plain', 'notes.txt'), 'inline')
  assert.equal(getDocumentViewerCapability('text/csv', 'data.csv'), 'inline')
})

test('document viewer capability falls back to download-only for unsupported preview types', () => {
  assert.equal(getDocumentViewerCapability('application/rtf', 'memo.rtf'), 'download-only')
  assert.equal(
    getDocumentViewerCapability('application/vnd.oasis.opendocument.text', 'draft.odt'),
    'download-only',
  )
  assert.equal(getDocumentViewerCapability('application/msword', 'legacy.doc'), 'download-only')
  assert.equal(
    getDocumentViewerCapability('application/vnd.ms-powerpoint', 'legacy.ppt'),
    'download-only',
  )
})

test('document viewer capability resolves mime type from file extension when missing', () => {
  assert.equal(
    getDocumentViewerCapability(null, 'statement.xlsx'),
    'inline',
  )
  assert.equal(getDocumentViewerCapability(undefined, 'archive.odp'), 'download-only')
})

test('toViewerFile preserves file name and resolved mime type', () => {
  const blob = new Blob(['hello'], { type: 'application/octet-stream' })
  const file = toViewerFile(blob, 'notes.txt', null)

  assert.equal(file.name, 'notes.txt')
  assert.equal(file.type, 'text/plain')
})
