import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { useAppVariant } from '@/app/hooks/use-app-variant'
import { AppBrandLogo } from '@/app/layouts/components/app-brand-logo'
import { EndPlanLogo, ThemeModeToggle } from '@/shared/ui'
import { LanguageSwitcher } from '@/shared/ui'

type AuthLayoutProps = {
  children: ReactNode
  sidebar?: ReactNode
  showDecorativeSidebar?: boolean
}

export function AuthLayout({ children, sidebar, showDecorativeSidebar = true }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-900 relative">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeModeToggle />
      </div>

      {showDecorativeSidebar && (
        <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-slate-100 dark:bg-ep-surface-panel relative overflow-hidden">
          {sidebar || <DefaultSidebar />}
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 pt-16">
          <div className="w-full max-w-md">{children}</div>
        </main>

        <footer className="py-4 px-4 text-center typo-caption text-slate-500 dark:text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} {t('common.appName')}. {t('auth.layout.allRightsReserved')}
          </p>
        </footer>
      </div>
    </div>
  )
}

function DefaultSidebar() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col justify-center h-full p-8 lg:p-12 xl:p-16">
      <AuthSidebarBrand />

      <div className="space-y-6">
        <h1 className="typo-heading-auth-hero text-slate-800 dark:text-slate-100">
          {t('auth.layout.welcomeTitle')}
        </h1>
        <p className="typo-lead text-slate-600 dark:text-slate-300">{t('auth.layout.welcomeSubtitle')}</p>
      </div>

      <div className="pt-4">
          <h2 className="typo-heading-card text-slate-800 dark:text-slate-100 mb-4">
            {t('auth.layout.securityTitle')}
          </h2>
          <ul className="space-y-3">
            <SecurityFeature text={t('auth.layout.featureopenSource')} />
            <SecurityFeature text={t('auth.layout.featureZeroKnowledge')} />
            <SecurityFeature text={t('auth.layout.featurePostQuantum')} />
            <SecurityFeature text={t('auth.layout.featureArgon2')} />
          </ul>
        </div>

      <PoweredByEndPlan />

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-200/50 to-transparent dark:from-slate-700/50" />
    </div>
  )
}

type SignupSidebarProps = {
  className?: string
}

export function SignupSidebar({ className = '' }: SignupSidebarProps) {
  const { t } = useTranslation()

  return (
    <div className={`flex flex-col justify-center h-full p-8 lg:p-12 xl:p-16 ${className}`}>
      <AuthSidebarBrand />

      <div className="space-y-6">
        <h1 className="typo-heading-auth-hero text-ep-primary dark:text-ep-primary-accent">
          {t('auth.layout.createTitle')}
        </h1>
        <p className="typo-lead text-slate-600 dark:text-slate-300">{t('auth.layout.createSubtitle')}</p>

        <div className="pt-4">
          <h2 className="typo-heading-card text-slate-800 dark:text-slate-100 mb-4">
            {t('auth.layout.securityTitle')}
          </h2>
          <ul className="space-y-3">
            <SecurityFeature text={t('auth.layout.featureopenSource')} />
            <SecurityFeature text={t('auth.layout.featureZeroKnowledge')} />
            <SecurityFeature text={t('auth.layout.featurePostQuantum')} />
            <SecurityFeature text={t('auth.layout.featureArgon2')} />
          </ul>
        </div>
      </div>

      <PoweredByEndPlan />

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-200/50 to-transparent dark:from-slate-700/50" />
    </div>
  )
}

/**
 * Sys branding centers the logo in the space above the hero copy; the default
 * brand keeps its compact top-left lockup.
 */
function AuthSidebarBrand() {
  const { t } = useTranslation()
  const appVariant = useAppVariant()

  if (appVariant.id !== 'sys') {
    return (
      <Link
        to={ROUTES.ROOT}
        className="mb-8 inline-flex items-center"
        aria-label={t('common.appName')}
      >
        <AppBrandLogo variant="lockup" />
      </Link>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center pb-10">
      <Link
        to={ROUTES.ROOT}
        className="inline-flex items-center"
        aria-label={t('shell.sysDemo.brandName')}
      >
        <AppBrandLogo variant="lockup" />
      </Link>
    </div>
  )
}

/** Sys-branded auth surfaces keep an EndPlan attribution at the bottom. */
function PoweredByEndPlan() {
  const { t } = useTranslation()
  const appVariant = useAppVariant()

  if (appVariant.id !== 'sys') return null

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-end gap-2 pt-14">
      <span className="typo-caption text-slate-500 dark:text-slate-400">
        {t('auth.layout.poweredBy')}
      </span>
      <EndPlanLogo alt={t('common.appName')} className="h-10 w-auto" />
    </div>
  )
}

function SecurityFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span>{text}</span>
    </li>
  )
}
