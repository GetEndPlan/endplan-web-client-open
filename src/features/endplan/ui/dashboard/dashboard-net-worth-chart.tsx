import { useId, useMemo } from 'react'
import type { NetWorthSlice } from '../../model/net-worth'
import {
  buildNetWorthDonutSegments,
  describeDonutArc,
  NET_WORTH_DONUT_INNER_RADIUS_RATIO,
  NET_WORTH_DONUT_OUTER_RADIUS_RATIO,
} from '../../model/net-worth-chart-segments'

type DashboardNetWorthChartProps = {
  slices: NetWorthSlice[]
  total: number
  colors: readonly string[]
  totalLabel: string
  formatCurrency: (value: number) => string
  hoveredSliceId?: string | null
  onSliceHover?: (sliceId: string, event: React.PointerEvent<SVGElement>) => void
  onSliceHoverEnd?: () => void
  onChartPointerMove?: (event: React.PointerEvent<SVGSVGElement>) => void
}

const VIEW_SIZE = 200
const HIT_STROKE_SCALE = 1.75

export function DashboardNetWorthChart({
  slices,
  total,
  colors,
  totalLabel,
  formatCurrency,
  hoveredSliceId = null,
  onSliceHover,
  onSliceHoverEnd,
  onChartPointerMove,
}: DashboardNetWorthChartProps) {
  const titleId = useId()
  const center = VIEW_SIZE / 2
  const outerRadius = center * NET_WORTH_DONUT_OUTER_RADIUS_RATIO
  const innerRadius = center * NET_WORTH_DONUT_INNER_RADIUS_RATIO
  const midRadius = (innerRadius + outerRadius) / 2
  const strokeWidth = outerRadius - innerRadius
  const hitStrokeWidth = strokeWidth * HIT_STROKE_SCALE

  const segments = useMemo(() => buildNetWorthDonutSegments(slices, colors), [colors, slices])

  return (
    <div className="relative mx-auto aspect-square h-44 w-44 min-w-0 sm:h-48 sm:w-48">
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="h-full w-full"
        role="img"
        aria-labelledby={titleId}
        onPointerMove={onChartPointerMove}
      >
        <title id={titleId}>
          {totalLabel}: {formatCurrency(total)}
        </title>
        <g>
          {segments.map((segment) => {
            const path = describeDonutArc(center, center, midRadius, segment.startAngle, segment.endAngle)
            const isHovered = hoveredSliceId === segment.id

            return (
              <g key={segment.id}>
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={hitStrokeWidth}
                  className="cursor-pointer"
                  onPointerEnter={(event) => onSliceHover?.(segment.id, event)}
                  onPointerMove={(event) => onSliceHover?.(segment.id, event)}
                  onPointerLeave={() => onSliceHoverEnd?.()}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="pointer-events-none transition-opacity"
                  style={{ opacity: hoveredSliceId == null || isHovered ? 1 : 0.45 }}
                />
              </g>
            )
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="typo-caption text-ep-body/50 dark:text-white/50">{totalLabel}</p>
        <p className="typo-body-sm-strong text-ep-body dark:text-white lg:typo-body">{formatCurrency(total)}</p>
      </div>
    </div>
  )
}
