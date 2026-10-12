import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextLinkButton } from '@/shared/ui'
import { cn } from '@/shared/lib'
import type { VaultResponse } from '../../api/clients/vault-api'
import { useDashboardNetWorth } from '../../hooks/dashboard/use-dashboard-net-worth'
import { getNetWorthSliceColor, NET_WORTH_CHART_COLORS } from '../../model/net-worth-chart-colors'
import { buildNetWorthLegendTooltipSlices } from '../../model/net-worth-legend-tooltip'
import { sortNetWorthSlicesByValueDesc } from '../../model/net-worth'
import { DashboardNetWorthChart } from './dashboard-net-worth-chart'
import { DashboardNetWorthLegendTooltip } from './dashboard-net-worth-legend-tooltip'

type DashboardNetWorthCardProps = {
  vault: VaultResponse | null
  className?: string
}

type TooltipState = {
  x: number
  y: number
  activeSliceId: string | null
}

export function DashboardNetWorthCard({ vault, className }: DashboardNetWorthCardProps) {
  const { t, i18n } = useTranslation()
  const prefix = 'dashboard.netWorth'
  const { status, summary, isError, refetch } = useDashboardNetWorth({
    vault,
    enabled: !!vault,
    otherAssetsLabel: t(`${prefix}.otherAssets`),
  })
  const contentRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const formatCurrency = useMemo(
    () => (value: number) =>
      new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
      }).format(value),
    [i18n.language],
  )

  const resolveSliceLabel = useCallback(
    (label: string) => label || t('dashboard.netWorth.unnamedAsset'),
    [t],
  )

  const showTooltip = useCallback((clientX: number, clientY: number, activeSliceId: string | null) => {
    const rect = contentRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }

    setTooltip({
      x: clientX - rect.left,
      y: clientY - rect.top,
      activeSliceId,
    })
  }, [])

  const clearActiveSlice = useCallback(() => {
    setTooltip((current) => (current ? { ...current, activeSliceId: null } : current))
  }, [])

  const moveTooltip = useCallback((clientX: number, clientY: number) => {
    const rect = contentRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }

    setTooltip((current) => ({
      x: clientX - rect.left,
      y: clientY - rect.top,
      activeSliceId: current?.activeSliceId ?? null,
    }))
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip(null)
  }, [])

  const orderedSlices = useMemo(
    () => (summary == null ? [] : sortNetWorthSlicesByValueDesc(summary.slices)),
    [summary],
  )

  const tooltipSlices = useMemo(
    () =>
      summary == null
        ? []
        : buildNetWorthLegendTooltipSlices(
            orderedSlices,
            NET_WORTH_CHART_COLORS,
            formatCurrency,
            (slice) => resolveSliceLabel(slice.label),
          ),
    [formatCurrency, orderedSlices, resolveSliceLabel, summary],
  )

  if (!vault) {
    return null
  }

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col rounded-ep-card border border-ep-border-card bg-ep-surface p-4',
        className,
      )}
    >
      <h2 className="typo-heading-section text-ep-body dark:text-white">{t(`${prefix}.cardTitle`)}</h2>
      <p className="mt-0.5 hidden typo-caption text-ep-body/60 dark:text-white/60 sm:block">
        {t(`${prefix}.cardSubtitle`)}
      </p>

      <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center">
        {status === 'loading' || status === 'idle' ? (
          <p className="py-6 text-center typo-body-sm text-ep-body/60 dark:text-white/50">
            {t(`${prefix}.loading`)}
          </p>
        ) : status === 'locked' ? (
          <p className="py-6 text-center typo-body-sm text-ep-body/60 dark:text-white/50">
            {t(`${prefix}.locked`)}
          </p>
        ) : isError ? (
          <div className="flex items-center justify-center gap-3 py-6">
            <p className="typo-body-sm text-ep-body/60 dark:text-white/50">{t(`${prefix}.error`)}</p>
            <TextLinkButton type="button" variant="caption" onClick={() => void refetch()}>
              {t(`${prefix}.retry`)}
            </TextLinkButton>
          </div>
        ) : !summary?.hasValueColumns ? (
          <div className="space-y-0.5 py-6 text-center">
            <p className="typo-body-sm text-ep-body/60 dark:text-white/50">{t(`${prefix}.noValueColumns`)}</p>
            <p className="typo-caption text-ep-body/40 dark:text-white/40">{t(`${prefix}.noValueColumnsHint`)}</p>
          </div>
        ) : summary.slices.length === 0 ? (
          <div className="space-y-0.5 py-6 text-center">
            <p className="typo-body-sm text-ep-body/60 dark:text-white/50">{t(`${prefix}.empty`)}</p>
            <p className="typo-caption text-ep-body/40 dark:text-white/40">{t(`${prefix}.emptyHint`)}</p>
          </div>
        ) : (
          <div
            ref={contentRef}
            className="relative flex min-h-0 flex-col gap-4 sm:flex-row sm:items-center"
            onMouseLeave={hideTooltip}
          >
            <div className="min-w-0 flex-1">
              <DashboardNetWorthChart
                slices={orderedSlices}
                total={summary.total}
                colors={NET_WORTH_CHART_COLORS}
                totalLabel={t(`${prefix}.totalLabel`)}
                formatCurrency={formatCurrency}
                hoveredSliceId={tooltip?.activeSliceId ?? null}
                onSliceHover={(sliceId, event) => showTooltip(event.clientX, event.clientY, sliceId)}
                onSliceHoverEnd={clearActiveSlice}
                onChartPointerMove={(event) => moveTooltip(event.clientX, event.clientY)}
              />
            </div>
            <ul className="min-w-0 flex-1 space-y-2">
              {orderedSlices.map((slice, index) => (
                <li
                  key={slice.id}
                  className={cn(
                    'flex cursor-default items-center gap-2 rounded-md px-1 py-0.5 transition-colors',
                    tooltip?.activeSliceId === slice.id && 'bg-ep-surface-subtle dark:bg-white/10',
                  )}
                  onMouseEnter={(event) => showTooltip(event.clientX, event.clientY, slice.id)}
                  onMouseMove={(event) => showTooltip(event.clientX, event.clientY, slice.id)}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: getNetWorthSliceColor(index),
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate typo-body-sm text-ep-body dark:text-white">
                    {resolveSliceLabel(slice.label)}
                  </span>
                  <span className="shrink-0 typo-body-sm-strong text-ep-body dark:text-white">
                    {formatCurrency(slice.value)}
                  </span>
                </li>
              ))}
            </ul>
            {tooltip ? (
              <DashboardNetWorthLegendTooltip
                slices={tooltipSlices}
                activeSliceId={tooltip.activeSliceId}
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translate(12px, calc(-100% - 8px))',
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
