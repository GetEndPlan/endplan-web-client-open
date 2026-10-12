import type { CSSProperties } from 'react'
import { cn } from '@/shared/lib'
import type { NetWorthLegendTooltipSlice } from '../../model/net-worth-legend-tooltip'

type DashboardNetWorthLegendTooltipProps = {
  slices: NetWorthLegendTooltipSlice[]
  activeSliceId: string | null
  className?: string
  style?: CSSProperties
}

export function DashboardNetWorthLegendTooltip({
  slices,
  activeSliceId,
  className,
  style,
}: DashboardNetWorthLegendTooltipProps) {
  return (
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-20 min-w-[10rem] max-w-[14rem] rounded-lg border border-ep-border bg-ep-surface px-2.5 py-2 shadow-ep-dropdown dark:shadow-ep-dropdown-dark',
        className,
      )}
      style={style}
    >
      <ul className="space-y-1">
        {slices.map((slice) => {
          const isActive = activeSliceId == null || activeSliceId === slice.id

          return (
            <li
              key={slice.id}
              className={cn(
                'flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors',
                activeSliceId === slice.id && 'bg-ep-surface-subtle dark:bg-white/10',
                !isActive && 'opacity-45',
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate typo-caption text-ep-body dark:text-white">
                {slice.displayLabel}
              </span>
              <span className="shrink-0 typo-caption-strong text-ep-body dark:text-white">
                {slice.formattedValue}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
