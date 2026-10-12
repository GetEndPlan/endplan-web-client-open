/**
 * Net-worth donut palette — high-contrast brand colors for clear slice separation.
 * Assigned by slice index after sorting highest amount → lowest.
 * Cycles after 5 categories.
 */
export const NET_WORTH_CHART_COLORS: readonly string[] = [
  '#7742FA',
  '#E4D9FE',
  '#6FA8EF',
  '#2E2446',
  '#A7A2B5',
] as const

export function getNetWorthSliceColor(index: number, colors: readonly string[] = NET_WORTH_CHART_COLORS): string {
  if (colors.length === 0) {
    return NET_WORTH_CHART_COLORS[0]
  }
  return colors[index % colors.length] ?? colors[0]
}
