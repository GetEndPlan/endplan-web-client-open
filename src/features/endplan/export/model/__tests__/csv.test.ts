import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { escapeCsvCell, toCsvDocument, toCsvRow } from '../csv.ts'

describe('csv helpers', () => {
  it('leaves simple cells unquoted', () => {
    assert.equal(escapeCsvCell('Checking'), 'Checking')
    assert.equal(toCsvRow(['Name', 'Bank']), 'Name,Bank')
  })

  it('quotes cells that contain commas, quotes, or newlines', () => {
    assert.equal(escapeCsvCell('Doe, Jane'), '"Doe, Jane"')
    assert.equal(escapeCsvCell('He said "hi"'), '"He said ""hi"""')
    assert.equal(escapeCsvCell('line1\nline2'), '"line1\nline2"')
  })

  it('builds a CRLF csv document with a trailing newline', () => {
    const csv = toCsvDocument(['Name', 'Role'], [['Ada', 'Lawyer']])
    assert.equal(csv, 'Name,Role\r\nAda,Lawyer\r\n')
  })
})
