import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DOCUMENT_FILE_INPUT_ACCEPT,
  formatAllowedDocumentTypeLabels,
  isAllowedDocumentFile,
  resolveAllowedDocumentMimeType,
} from '../document-upload-policy.ts'

test('document upload policy accepts known mime type and normalizes it', () => {
  const mime = resolveAllowedDocumentMimeType({
    name: 'report.PDF',
    type: 'APPLICATION/PDF; charset=utf-8',
  })

  assert.equal(mime, 'application/pdf')
  assert.equal(isAllowedDocumentFile({ name: 'report.PDF', type: 'APPLICATION/PDF' }), true)
})

test('document upload policy falls back to extension mapping when mime type is unknown', () => {
  const mime = resolveAllowedDocumentMimeType({
    name: 'statement.xlsx',
    type: 'application/octet-stream',
  })

  assert.equal(mime, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
})

test('document upload policy rejects unsupported files', () => {
  assert.equal(
    resolveAllowedDocumentMimeType({ name: 'malware.exe', type: 'application/octet-stream' }),
    null,
  )
  assert.equal(isAllowedDocumentFile({ name: 'photo.png', type: 'image/png' }), false)
})

test('document upload policy exposes expected accept tokens', () => {
  assert.equal(DOCUMENT_FILE_INPUT_ACCEPT.includes('.pdf'), true)
  assert.equal(DOCUMENT_FILE_INPUT_ACCEPT.includes('application/pdf'), true)
})

test('document upload policy supports extension fallback when mime is empty', () => {
  const mime = resolveAllowedDocumentMimeType({
    name: 'legacy.DOC',
    type: '',
  })

  assert.equal(mime, 'application/msword')
  assert.equal(isAllowedDocumentFile({ name: 'legacy.DOC', type: '' }), true)
})

test('document upload policy rejects missing extension when mime is generic', () => {
  const mime = resolveAllowedDocumentMimeType({
    name: 'README',
    type: 'application/octet-stream',
  })

  assert.equal(mime, null)
})

test('document upload policy strips mime parameters before evaluation', () => {
  const mime = resolveAllowedDocumentMimeType({
    name: 'slides.pptx',
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation; charset=binary',
  })

  assert.equal(mime, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
})

test('document upload policy accept list is unique', () => {
  const tokens = DOCUMENT_FILE_INPUT_ACCEPT.split(',')
  const unique = new Set(tokens)
  assert.equal(unique.size, tokens.length)
})

test('formatAllowedDocumentTypeLabels lists every allowed extension', () => {
  const labels = formatAllowedDocumentTypeLabels()
  assert.equal(labels.includes('PDF'), true)
  assert.equal(labels.includes('DOCX'), true)
  assert.equal(labels.includes('XLSX'), true)
  assert.equal(labels.includes('PPTX'), true)
  assert.equal(labels.includes('ODT'), true)
  assert.equal(labels.startsWith('PDF, '), true)
})
