import { type ReactNode, useMemo, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/app/constants/routes'
import { ModalOverlay } from '@/shared/ui'
import { UnlockEndplanGateCard } from '@/features/keys'
import { EndplanExportHost } from '@/features/endplan'
import { AppBottomBar, AppShellChrome, AppSidebar, AppTopbar, appShellSidebarWidth } from './components'
import { useEnsureOwnedVaultOnUnlock, useMainLayoutState } from './hooks'
import { MobileDrawerProvider } from './mobile-drawer-provider'

type MainLayoutProps = {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()
  const {
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    openMobileDrawer,
    closeMobileDrawer,
    planBadge,
    dismissPlanBadge,
    needsUnlock,
  } = useMainLayoutState()

  useEnsureOwnedVaultOnUnlock()

  const mobileDrawerValue = useMemo(
    () => ({
      isOpen: isMobileDrawerOpen,
      open: openMobileDrawer,
      close: closeMobileDrawer,
    }),
    [isMobileDrawerOpen, openMobileDrawer, closeMobileDrawer],
  )

  const isWideEndplanSectionRoute = useMemo(() => {
    return (
      /\/endplan\/(?:documents|assets|policies|instructions|contacts)(?:\/|$)/.test(location.pathname) ||
      /\/shared-endplan\/[^/]+\/(?:documents|assets|policies|instructions|contacts)(?:\/|$)/.test(
        location.pathname,
      )
    )
  }, [location.pathname])

  const isFullWidthContentRoute = useMemo(() => {
    return isWideEndplanSectionRoute || location.pathname === ROUTES.DASHBOARD
  }, [isWideEndplanSectionRoute, location.pathname])

  const shellSidebarWidth = appShellSidebarWidth(isSidebarCollapsed)
  const shellLayoutStyle = {
    ['--ep-shell-sidebar-width' as string]: shellSidebarWidth,
  } as CSSProperties

  return (
    <MobileDrawerProvider value={mobileDrawerValue}>
      <div
        className="relative min-h-screen overflow-x-hidden bg-ep-surface transition-colors"
        style={shellLayoutStyle}
      >
        <AppShellChrome />
        {/* Sidebar */}
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          mobileDrawerOpen={isMobileDrawerOpen}
          onMobileDrawerOpenChange={setIsMobileDrawerOpen}
        />

        {/* Main content */}
        <div
          className="min-w-0 min-h-screen flex flex-col transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[var(--ep-shell-sidebar-width)]"
        >
          <AppTopbar planBadge={planBadge} onDismissPlanBadge={dismissPlanBadge} />
          <main
            className={`flex h-full min-h-0 flex-1 flex-col overflow-x-hidden p-4 pb-4 sm:p-6 lg:pb-20 ${
              isFullWidthContentRoute
                ? 'lg:px-5 lg:py-4 lg:pb-14'
                : 'lg:px-ep-content-x lg:py-ep-content-y lg:pb-20'
            }`}
          >
            <div
              className={
                isFullWidthContentRoute
                  ? 'flex h-full min-h-0 w-full flex-1 flex-col'
                  : 'mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col 2xl:max-w-[100rem]'
              }
            >
              {children}
            </div>
          </main>
        </div>

        <AppBottomBar isSidebarCollapsed={isSidebarCollapsed} />

        <EndplanExportHost />

        {/* Unlock Keys Modal Overlay */}
        {needsUnlock && (
          <ModalOverlay>
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
              <UnlockEndplanGateCard />
            </div>
          </ModalOverlay>
        )}
      </div>
    </MobileDrawerProvider>
  )
}
