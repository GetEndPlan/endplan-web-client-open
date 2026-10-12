import test from 'node:test'
import assert from 'node:assert/strict'

import { applyAppVariantDocumentChrome, resolveAppVariant } from '../app-variant.ts'

const SYS_HOST = 'partner.example'

test('resolveAppVariant returns sys config for the configured host', () => {
  const variant = resolveAppVariant(SYS_HOST, SYS_HOST)
  assert.equal(variant.id, 'sys')
  assert.equal(variant.showExportPdfButton, true)
})

test('resolveAppVariant is case-insensitive for the configured host', () => {
  assert.equal(resolveAppVariant('Partner.Example', SYS_HOST).id, 'sys')
})

test('resolveAppVariant returns default for other hosts and when no sys host is set', () => {
  assert.equal(resolveAppVariant('app.example', SYS_HOST).id, 'default')
  assert.equal(resolveAppVariant('localhost', SYS_HOST).id, 'default')
  assert.equal(resolveAppVariant(SYS_HOST, '').id, 'default')
})

test('applyAppVariantDocumentChrome is exported for bootstrap use', () => {
  assert.equal(typeof applyAppVariantDocumentChrome, 'function')
})
