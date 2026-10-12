import { EndPlanIcon, type EndPlanIconName } from '@/shared/ui'

type StatItem = {
  label: string
  value: string
  icon: EndPlanIconName
}

type DashboardStatsProps = {
  stats: StatItem[]
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex min-h-[72px] items-center gap-3 rounded-ep-card border border-ep-border-card bg-ep-surface p-3 lg:min-h-[88px] lg:gap-4 lg:p-5"
        >
          <div className="flex size-7 shrink-0 items-center justify-center lg:size-9">
            <EndPlanIcon name={stat.icon} size={24} className="size-6 lg:size-8" />
          </div>
          <div className="min-w-0">
            <p className="typo-heading-card truncate text-ep-body dark:text-white lg:typo-heading-section">{stat.value}</p>
            <p className="truncate typo-caption text-ep-body/60 dark:text-white/70 lg:typo-body-sm">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
