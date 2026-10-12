import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { joinZipPath, sanitizeZipSegment, uniqueZipPath } from '../zip-path.ts'

describe('zip path helpers', () => {
  it('strips reserved characters and empty names', () => {
    assert.equal(sanitizeZipSegment('Taxes / 2024', 'Untitled'), 'Taxes 2024')
    assert.equal(sanitizeZipSegment('..', 'Untitled folder'), 'Untitled folder')
    assert.equal(sanitizeZipSegment('CON.txt', 'Untitled'), '_CON.txt')
  })

  it('joins path segments without empty parts', () => {
    assert.equal(joinZipPath(['My EndPlan', 'Documents', 'will.pdf']), 'My EndPlan/Documents/will.pdf')
  })

  it('uniquifies colliding file and folder paths', () => {
    const used = new Set<string>()
    assert.equal(uniqueZipPath('Documents/will.pdf', used), 'Documents/will.pdf')
    assert.equal(uniqueZipPath('Documents/will.pdf', used), 'Documents/will (2).pdf')
    assert.equal(uniqueZipPath('Documents/Taxes/', used), 'Documents/Taxes/')
    assert.equal(uniqueZipPath('Documents/Taxes/', used), 'Documents/Taxes (2)/')
  })
})
