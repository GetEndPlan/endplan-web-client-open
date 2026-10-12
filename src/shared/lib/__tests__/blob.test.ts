import { randomBytes } from 'node:crypto'
import test from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'

import { uint8ArrayToBase64 } from '../blob.ts'

test('uint8ArrayToBase64 encodes empty input', () => {
  assert.equal(uint8ArrayToBase64(new Uint8Array([])), '')
})

test('uint8ArrayToBase64 encodes full triplets', () => {
  assert.equal(uint8ArrayToBase64(new Uint8Array([0, 1, 2])), 'AAEC')
  assert.equal(uint8ArrayToBase64(new Uint8Array([72, 101, 108])), 'SGVs')
})

test('uint8ArrayToBase64 pads one trailing byte', () => {
  assert.equal(uint8ArrayToBase64(new Uint8Array([0])), 'AA==')
})

test('uint8ArrayToBase64 pads two trailing bytes', () => {
  assert.equal(uint8ArrayToBase64(new Uint8Array([0, 1])), 'AAE=')
})

test('uint8ArrayToBase64 matches Node base64 for random payload', () => {
  const raw = randomBytes(127)
  assert.equal(uint8ArrayToBase64(new Uint8Array(raw)), Buffer.from(raw).toString('base64'))
})
