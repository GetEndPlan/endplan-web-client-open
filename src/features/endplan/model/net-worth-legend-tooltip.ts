import type { NetWorthSlice } from './net-worth'
import { sortNetWorthSlicesByValueDesc } from './net-worth'
import { getNetWorthSliceColor } from './net-worth-chart-colors'

export type NetWorthLegendTooltipSlice = NetWorthSlice & {
  color: string
  displayLabel: string
  formattedValue: string
}

export function buildNetWorthLegendTooltipSlices(
  slices: NetWorthSlice[],
  colors: readonly string[],
  formatCurrency: (value: number) => string,
  resolveLabel: (slice: NetWorthSlice) => string,
): NetWorthLegendTooltipSlice[] {
  return sortNetWorthSlicesByValueDesc(slices).map((slice, index) => ({
    ...slice,
    color: getNetWorthSliceColor(index, colors),
    displayLabel: resolveLabel(slice),
    formattedValue: formatCurrency(slice.value),
  }))
}
