import type { NetWorthSlice } from './net-worth'
import { sortNetWorthSlicesByValueDesc } from './net-worth'
import { getNetWorthSliceColor } from './net-worth-chart-colors'

export type NetWorthDonutSegment = NetWorthSlice & {
  color: string
  startAngle: number
  endAngle: number
}

/** Largest slice begins at 12 o'clock and proceeds clockwise. */
export const NET_WORTH_DONUT_START_ANGLE = -90

/** Gap between arc segments in degrees (background shows through). */
export const NET_WORTH_DONUT_GAP_DEGREES = 4

export const NET_WORTH_DONUT_INNER_RADIUS_RATIO = 0.58
export const NET_WORTH_DONUT_OUTER_RADIUS_RATIO = 0.82

export function buildNetWorthDonutSegments(
  slices: NetWorthSlice[],
  colors: readonly string[],
): NetWorthDonutSegment[] {
  if (slices.length === 0) {
    return []
  }

  const ordered = sortNetWorthSlicesByValueDesc(slices)
  const total = ordered.reduce((sum, slice) => sum + slice.value, 0)
  if (total <= 0) {
    return []
  }

  const gap = ordered.length > 1 ? NET_WORTH_DONUT_GAP_DEGREES : 0
  const sweepBudget = 360 - ordered.length * gap
  let cursor = NET_WORTH_DONUT_START_ANGLE

  return ordered.map((slice, index) => {
    const sweep = (slice.value / total) * sweepBudget
    const segment: NetWorthDonutSegment = {
      ...slice,
      color: getNetWorthSliceColor(index, colors),
      startAngle: cursor,
      endAngle: cursor + sweep,
    }
    cursor += sweep + gap
    return segment
  })
}

export function polarToCartesian(cx: number, cy: number, radius: number, angleDegrees: number) {
  const radians = (angleDegrees * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

/** SVG arc path along a circle (used with round stroke caps). */
export function describeDonutArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  if (endAngle - startAngle >= 359.99) {
    // Full ring: two half-arcs avoid SVG arc singularities at 360°.
    const mid = startAngle + 180
    const start = polarToCartesian(cx, cy, radius, startAngle)
    const middle = polarToCartesian(cx, cy, radius, mid)
    const end = polarToCartesian(cx, cy, radius, endAngle)
    return [
      `M ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 0 1 ${middle.x} ${middle.y}`,
      `A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`,
    ].join(' ')
  }

  const start = polarToCartesian(cx, cy, radius, startAngle)
  const end = polarToCartesian(cx, cy, radius, endAngle)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
}
