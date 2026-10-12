import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, CreditCard, Info, LogOut, Menu, Settings, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import type { useTrialBannerState } from '@/app/layouts/hooks/use-trial-banner-state'
import { createBillingUpgradeModalState } from '@/features/billing'
import { useSidebarUserBadge } from '@/features/billing/hooks/use-sidebar-user-badge'
import { useAuthUser, useLogout } from '@/features/auth/session'
import { useTrustedMemberView } from '@/features/endplan'
import { LanguageSwitcher, ThemeModeToggle } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { AppBrandLogo } from './app-brand-logo'
import { AppSysExportPdfButton } from './app-sys-export-pdf-button'
import { useAppVariant } from '@/app/hooks/use-app-variant'
import { useMobileDrawer } from '../hooks/use-mobile-drawer'
import { useTopbarBreadcrumbs } from '../hooks/use-topbar-breadcrumbs'

type PlanBadge = ReturnType<typeof useTrialBannerState>['planBadge']

type AppTopbarProps = {
  planBadge?: PlanBadge
  onDismissPlanBadge?: () => void
}

export function AppTopbar({ planBadge, onDismissPlanBadge }: AppTopbarProps) {
  const { t } = useTranslation()
  const appVariant = useAppVariant()
  const appBrandLabel =
    appVariant.id === 'sys' ? t('shell.sysDemo.brandName') : t('common.appName')
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthUser()
  const logout = useLogout()
  const { isTrustedMemberView } = useTrustedMemberView()
  const profileBadge = useSidebarUserBadge()
  const { open: openMobileDrawer } = useMobileDrawer()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMenuMounted, setIsMenuMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuCloseTimerRef = useRef<number | null>(null)
  const breadcrumbs = useTopbarBreadcrumbs()

  const openMenu = () => {
    if (menuCloseTimerRef.current !== null) {
      window.clearTimeout(menuCloseTimerRef.current)
      menuCloseTimerRef.current = null
    }
    setIsMenuMounted(true)
    window.requestAnimationFrame(() => {
      setIsMenuOpen(true)
    })
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    if (menuCloseTimerRef.current !== null) {
      window.clearTimeout(menuCloseTimerRef.current)
    }
    menuCloseTimerRef.current = window.setTimeout(() => {
      setIsMenuMounted(false)
      menuCloseTimerRef.current = null
    }, 180)
  }

  const toggleMenu = () => {
    if (isMenuOpen || isMenuMounted) {
      closeMenu()
      return
    }
    openMenu()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      if (menuCloseTimerRef.current !== null) {
        window.clearTimeout(menuCloseTimerRef.current)
        menuCloseTimerRef.current = null
      }
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleLogout = async () => {
    await logout.mutateAsync()
    closeMenu()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const displayName = profileBadge?.displayName ?? user?.name?.trim() ?? t('common.user')
  const initials = profileBadge?.initials ?? '?'
  const statusLine = profileBadge?.statusLine
  const imageUrl = user?.imageUrl

  const breadcrumbNav =
    breadcrumbs.length > 0 ? (
      <nav
        aria-label={t('common.breadcrumb')}
        className="flex min-w-0 items-center gap-3 overflow-hidden font-ep text-ep-body-01"
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <Fragment key={`${breadcrumb.label}-${index}`}>
              {index > 0 ? (
                <span className="shrink-0 text-ep-body/30 dark:text-white/30">/</span>
              ) : null}

              {breadcrumb.href && !isLast ? (
                <Link
                  to={breadcrumb.href}
                  className="min-w-0 truncate font-ep text-ep-body-02 text-ep-body/60 transition hover:text-ep-body dark:text-white dark:hover:text-white"
                >
                  {breadcrumb.label}
                </Link>
              ) : (
                <span
                  className={`min-w-0 truncate font-ep text-ep-body-02 ${
                    isLast
                      ? 'typo-emphasis text-ep-body dark:text-white'
                      : 'text-ep-body/60 dark:text-white'
                  }`}
                >
                  {breadcrumb.label}
                </span>
              )}
            </Fragment>
          )
        })}
      </nav>
    ) : null

  const profileMenu = (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggleMenu}
        className="flex max-w-[min(100vw-12rem,20rem)] items-center gap-1.5 rounded-ep-pill py-0.5 pl-0.5 pr-0.5 transition hover:bg-ep-surface-subtle lg:gap-3 lg:pr-1"
        aria-expanded={isMenuOpen && isMenuMounted}
        aria-haspopup="menu"
        aria-label={t('nav.settings')}
      >
        <div
          className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ep-avatar font-ep text-ep-body-03 text-ep-body dark:text-white lg:size-10"
          aria-hidden
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="hidden min-w-0 text-left lg:block">
          <span className="typo-emphasis-strong block truncate font-ep text-ep-body-01 text-ep-body dark:text-white">
            {displayName}
          </span>
          {statusLine ? (
            <span className="typo-caption mt-0.5 block truncate text-ep-body/50 dark:text-white/60">
              {statusLine}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-ep-body dark:text-white lg:ml-1"
          aria-hidden
        />
      </button>

      {isMenuMounted && (
        <div
          className={`absolute right-0 mt-1 w-56 origin-top-right rounded-xl border border-ep-border bg-ep-surface p-1 shadow-ep-dropdown will-change-transform dark:shadow-ep-dropdown-dark ${
            isMenuOpen ? 'topbar-menu-enter pointer-events-auto' : 'topbar-menu-exit pointer-events-none'
          }`}
          role="menu"
        >
          {user ? (
            <>
              <div className="px-2 py-1 lg:hidden">
                <p className="truncate typo-topbar-user text-ep-body dark:text-white">
                  {displayName}
                </p>
                {statusLine ? (
                  <p className="truncate font-ep text-ep-body-04 text-ep-body/50 dark:text-white">
                    {statusLine}
                  </p>
                ) : null}
              </div>
              <div className="my-1 border-t border-ep-border dark:border-ep-border lg:hidden" />
            </>
          ) : null}

          <Link
            to={ROUTES.SETTINGS}
            onClick={closeMenu}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-ep text-ep-body-02 text-ep-body transition hover:bg-ep-surface-subtle dark:text-white dark:hover:bg-ep-primary/10"
            role="menuitem"
          >
            <Settings className="size-4 text-ep-body/50 dark:text-white/50" />
            <span>{t('nav.settings')}</span>
          </Link>

          <Link
            to={ROUTES.SETTINGS_BILLING}
            onClick={closeMenu}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-ep text-ep-body-02 text-ep-body transition hover:bg-ep-surface-subtle dark:text-white dark:hover:bg-ep-primary/10"
            role="menuitem"
          >
            <CreditCard className="size-4 text-ep-body/50 dark:text-white/50" />
            <span>{t('nav.upgradePlan')}</span>
          </Link>

          <div className="my-1 border-t border-ep-border dark:border-ep-border" />

          <div className="flex items-center rounded-lg px-2 py-1">
            <LanguageSwitcher compact />
          </div>

          <div className="my-1 border-t border-ep-border dark:border-ep-border" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-ep text-ep-body-02 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="size-4" />
            <span>{logout.isPending ? t('auth.logout.loggingOut') : t('nav.logout')}</span>
          </button>
        </div>
      )}
    </div>
  )

  const isSysVariant = appVariant.id === 'sys'
  const headerRef = useRef<HTMLElement | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useLayoutEffect(() => {
    const header = headerRef.current
    if (!header) return

    const syncHeight = () => {
      setHeaderHeight(header.getBoundingClientRect().height)
    }

    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(header)
    return () => observer.disconnect()
  }, [planBadge])

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 border-b border-ep-border-subtle bg-ep-surface lg:left-[var(--ep-shell-sidebar-width)]"
        style={{ backgroundColor: 'rgb(var(--ep-surface))' }}
      >
      <div className="px-4 sm:px-6 lg:px-ep-content-x">
        <div className="relative box-border flex h-14 min-h-14 max-h-14 items-center gap-3 lg:h-16 lg:min-h-16 lg:max-h-16 lg:gap-4">
          <button
            type="button"
            onClick={openMobileDrawer}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-ep-pill text-ep-body lg:hidden dark:text-white"
            aria-label={t('common.openDrawer')}
          >
            <Menu className="size-5" strokeWidth={1.75} />
          </button>

          <div className="hidden min-w-0 flex-1 lg:block">{breadcrumbNav}</div>

          {isSysVariant ? (
            <Link
              to={ROUTES.DASHBOARD}
              className="flex min-w-0 flex-1 items-center lg:hidden"
              aria-label={appBrandLabel}
            >
              <AppBrandLogo />
            </Link>
          ) : (
            <Link
              to={ROUTES.DASHBOARD}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden"
              aria-label={appBrandLabel}
            >
              <AppBrandLogo />
            </Link>
          )}

          <div
            className={cn(
              'ml-auto flex shrink-0 items-center',
              isSysVariant ? 'gap-3 pl-4 sm:pl-6 lg:gap-5 lg:pl-8' : 'gap-4',
            )}
          >
            <AppSysExportPdfButton />
            <div className="hidden lg:block">
              <ThemeModeToggle />
            </div>

            {profileMenu}
          </div>
        </div>

        {breadcrumbNav ? <div className="pb-3 pt-0 lg:hidden">{breadcrumbNav}</div> : null}
      </div>
      {planBadge && (
        <div
          className={
            planBadge.tone === 'expired'
              ? 'border-t border-[#f2b8b8] bg-[#FDDBDB] dark:border-red-900/70 dark:bg-red-950'
              : 'border-t border-slate-200 bg-amber-50 dark:border-slate-700 dark:bg-amber-950'
          }
        >
          <div className="px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div
                className={`flex min-w-0 items-center gap-2 typo-body-sm ${
                  planBadge.tone === 'expired'
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-amber-800 dark:text-amber-200'
                }`}
              >
                <Info className="h-4 w-4 shrink-0" />
                <span className="truncate">{planBadge.label}</span>
                {planBadge.actionHref &&
                  planBadge.actionLabel &&
                  (!isTrustedMemberView || planBadge.showActionInTrustedMemberView) && (
                    <Link
                      to={planBadge.actionHref}
                      state={createBillingUpgradeModalState(location)}
                      className={`shrink-0 typo-emphasis underline underline-offset-2 transition ${
                        planBadge.tone === 'expired'
                          ? 'hover:text-red-950 dark:hover:text-red-50'
                          : 'hover:text-amber-900 dark:hover:text-amber-100'
                      }`}
                    >
                      {planBadge.actionLabel}
                    </Link>
                  )}
              </div>
              {onDismissPlanBadge && planBadge.tone !== 'expired' && (
                <button
                  type="button"
                  onClick={onDismissPlanBadge}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-700 transition hover:bg-amber-100 hover:text-amber-900 dark:text-amber-300 dark:hover:bg-amber-900/30 dark:hover:text-amber-100"
                  aria-label={t('common.close')}
                  title={t('common.close')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </header>
      <div aria-hidden className="shrink-0" style={{ height: headerHeight || undefined }} />
    </>
  )
}
