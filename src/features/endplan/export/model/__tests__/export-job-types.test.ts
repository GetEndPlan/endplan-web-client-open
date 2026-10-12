import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { endplanExportPercent } from '../export-job-types.ts'

describe('endplanExportPercent', () => {
  it('returns 0 without progress and clamps completed work', () => {
    assert.equal(endplanExportPercent(null), 0)
    assert.equal(
      endplanExportPercent({ stage: 'preparing', completedUnits: 0, totalUnits: 4 }),
      0,
    )
    assert.equal(
      endplanExportPercent({ stage: 'packaging', completedUnits: 4, totalUnits: 4 }),
      100,
    )
  })
})
