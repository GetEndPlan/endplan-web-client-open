import assert from 'node:assert/strict'
import test from 'node:test'
import { getNetWorthSliceColor, NET_WORTH_CHART_COLORS } from '../net-worth-chart-colors'
import {
  buildNetWorthDonutSegments,
  describeDonutArc,
  NET_WORTH_DONUT_GAP_DEGREES,
  NET_WORTH_DONUT_START_ANGLE,
} from '../net-worth-chart-segments'

test('net worth chart palette uses the five high-contrast brand colors', () => {
  assert.deepEqual(NET_WORTH_CHART_COLORS, ['#7742FA', '#E4D9FE', '#6FA8EF', '#2E2446', '#A7A2B5'])
})

test('getNetWorthSliceColor assigns palette sequentially and cycles after 5', () => {
  assert.equal(getNetWorthSliceColor(0), '#7742FA')
  assert.equal(getNetWorthSliceColor(1), '#E4D9FE')
  assert.equal(getNetWorthSliceColor(2), '#6FA8EF')
  assert.equal(getNetWorthSliceColor(3), '#2E2446')
  assert.equal(getNetWorthSliceColor(4), '#A7A2B5')
  assert.equal(getNetWorthSliceColor(5), '#7742FA')
})

test('buildNetWorthDonutSegments sorts by value desc and assigns first palette color to largest', () => {
  const segments = buildNetWorthDonutSegments(
    [
      { id: 'small', label: 'Car', value: 40_000 },
      { id: 'large', label: 'Trading', value: 300_000 },
      { id: 'mid', label: 'House', value: 200_000 },
    ],
    NET_WORTH_CHART_COLORS,
  )

  assert.deepEqual(
    segments.map((segment) => ({ id: segment.id, color: segment.color })),
    [
      { id: 'large', color: '#7742FA' },
      { id: 'mid', color: '#E4D9FE' },
      { id: 'small', color: '#6FA8EF' },
    ],
  )
  assert.equal(segments[0]?.startAngle, NET_WORTH_DONUT_START_ANGLE)
  assert.equal(segments[1]?.startAngle, segments[0]!.endAngle + NET_WORTH_DONUT_GAP_DEGREES)
  assert.equal(segments[2]?.endAngle, NET_WORTH_DONUT_START_ANGLE + 360 - NET_WORTH_DONUT_GAP_DEGREES)
})

test('describeDonutArc returns a closed path command for a full ring', () => {
  const path = describeDonutArc(100, 100, 70, -90, 270)
  assert.match(path, /^M /)
  assert.equal(path.split('A').length, 3)
})
