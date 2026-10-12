import type { ReactNode } from 'react'
import { CreditCard, FileText, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { cn } from '@/shared/lib'
import { Card } from '@/shared/ui'

type SettingsShellProps = {
  children: ReactNode
}

type SettingsSection = 'profile' | 'dataPrivacy' | 'billing'

const navConfig: Record<SettingsSection, { href: string; icon: typeof User; labelKey: string }> = {
  profile: {
    href: ROUTES.SETTINGS,
    icon: User,
    labelKey: 'nav.profile',
  },
  billing: {
    href: ROUTES.SETTINGS_BILLING,
    icon: CreditCard,
    labelKey: 'nav.billing',
  },
  dataPrivacy: {
    href: ROUTES.SETTINGS_DATA_PRIVACY,
    icon: FileText,
    labelKey: 'nav.dataPrivacy',
  },
}

export function SettingsShell({ children }: SettingsShellProps) {
  const { t } = useTranslation()

  return (
    <Card
      padding="none"
      className="flex min-h-[28rem] flex-1 flex-col overflow-hidden shadow-sm lg:min-h-[calc(100dvh-12rem)]"
    >
      <div className="grid min-h-0 flex-1 lg:grid-cols-[208px_minmax(0,1fr)]">
        <aside className="ep-settings-nav-aside">
          <p className="mb-1 typo-caption-emphasis uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('settings.navSectionLabel')}
          </p>
          {(Object.keys(navConfig) as SettingsSection[]).map((section) => {
            const item = navConfig[section]
            const Icon = item.icon

            return (
              <NavLink
                key={section}
                to={item.href}
                end={section === 'profile' || section === 'dataPrivacy'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 transition',
                    'border border-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-ep-surface-panel',
                    isActive
                      ? 'bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary/10 dark:text-ep-primary-muted'
                      : '',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="typo-body-sm-emphasis">{t(item.labelKey)}</span>
              </NavLink>
            )
          })}
        </aside>

        <section className="ep-settings-content">{children}</section>
      </div>
    </Card>
  )
}
