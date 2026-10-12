import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  BookOpenText,
  Clock,
  Contact,
  FileText,
  LayoutDashboard,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  Users,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  ROUTES,
  endplanSectionPath,
  sharedEndplanPath,
  sharedEndplanSectionPath,
} from '@/app/constants/routes'
import { useAppVariant } from '@/app/hooks/use-app-variant'
import { useAuthUser } from '@/features/auth/session'
import {
  SECTION_ID,
  getSharedVaultDisplayName,
  useSetupProgress,
  useSharedVaultSidebarNav,
  useUserVault,
} from '@/features/endplan'
import { isInviteOnlyKeyPersonOnboarding, useSubscription } from '@/features/billing'
import {
  KeyPersonForOwnerSidebarCard,
  KeyPersonStartOwnEndplanSidebarCard,
} from '@/features/trusted-circle'
import {
  SidebarDesktop,
  SidebarExpandableNavItem,
  SidebarLink,
  SidebarMobile,
  type NavLinkLeaf,
  type NavSection,
} from '@/shared/ui/organisms/sidebar'
import { ThemeModeToggle } from '@/shared/ui'
import { AppBrandLogo } from './app-brand-logo'

function setupProgressStepsTooltipLabel(
  t: (key: string) => string,
  steps: { done: boolean; labelKey: string }[],
  percentage: number,
): string {
  const header = `${t('nav.setupProgress')} · ${percentage}%`
  const lines = steps.map(({ done, labelKey }) => `${done ? '✓' : '○'} ${t(`nav.${labelKey}`)}`)
  return [header, ...lines].join('\n')
}

function AppSidebarProgressStepsPopover({
  steps,
  t,
  popoverClassName,
}: {
  steps: { done: boolean; labelKey: string }[]
  t: (key: string) => string
  popoverClassName: string
}) {
  return (
    <div
      className={`absolute top-full z-[60] mt-1 py-2 px-3 rounded-lg bg-ep-surface text-ep-body shadow-ep-dropdown-dark border border-ep-border opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity ${popoverClassName}`}
    >
      <ul className="space-y-1.5">
        {steps.map(({ done, labelKey }) => (
          <li
            key={labelKey}
            className={`flex items-center gap-2 typo-caption ${done ? 'text-ep-primary dark:text-ep-primary-accent' : 'text-ep-body/50 dark:text-white/60'}`}
          >
            <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              {done ? '✓' : '○'}
            </span>
            <span>{t(`nav.${labelKey}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AppSidebarProgress({ isCollapsed }: { isCollapsed: boolean }) {
  const { t } = useTranslation()
  const { steps, percentage, isReady } = useSetupProgress()

  if (!isReady || percentage >= 100) {
    return null
  }

  const tooltipLabel = setupProgressStepsTooltipLabel(t, steps, percentage)

  if (isCollapsed) {
    return (
      <div className="group relative z-10 shrink-0 w-full min-w-0 overflow-hidden border-b border-ep-border-subtle px-1 py-2">
        <div
          className="flex w-full min-w-0 flex-col gap-0.5 text-left"
          aria-label={tooltipLabel}
        >
          <p className="typo-sidebar-collapsed-setup-line block w-full min-w-0 truncate text-ep-body/60 dark:text-white/60">
            {t('nav.setupProgressCollapsedLine1')}
          </p>
          <p className="typo-sidebar-collapsed-setup-line block w-full min-w-0 truncate text-ep-body/60 dark:text-white/60">
            {t('nav.setupProgressCollapsedLine2')}
          </p>
          <p className="typo-sidebar-collapsed-setup-percent truncate text-ep-body">
            {percentage}%
          </p>
        </div>
        <AppSidebarProgressStepsPopover
          steps={steps}
          t={t}
          popoverClassName="left-0 min-w-[220px] max-w-[min(100vw-5rem,18rem)]"
        />
      </div>
    )
  }

  return (
    <div className="group relative z-10 mx-1 mb-3 shrink-0 px-1">
      <div
        className="rounded-ep-card bg-ep-surface-subtle p-3 [background-size:12px_12px] [background-image:radial-gradient(circle,rgb(var(--ep-body)/0.05)_1px,transparent_1px)] dark:bg-ep-primary dark:[background-image:radial-gradient(circle,rgb(255_255_255/0.12)_1px,transparent_1px)]"
        aria-label={tooltipLabel}
      >
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="typo-body-sm-strong text-ep-body dark:text-white">
            {t('nav.setupProgress')}
          </p>
          <p className="typo-body-sm-strong tabular-nums text-ep-body dark:text-white">
            {percentage}%
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ep-primary-softer dark:bg-black/25">
          <div
            className="h-full rounded-full bg-ep-primary transition-all duration-500 dark:bg-white"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('nav.setupProgress')}
          />
        </div>
      </div>
      <AppSidebarProgressStepsPopover steps={steps} t={t} popoverClassName="left-2 right-2" />
    </div>
  )
}

function buildPrimaryNav(t: (key: string) => string): NavSection {
  return {
    items: [
      {
        id: 'dashboard',
        label: t('nav.dashboard'),
        icon: <LayoutDashboard className="w-4 h-4" strokeWidth={1.75} />,
        href: ROUTES.DASHBOARD,
        dataTour: 'nav-dashboard',
      },
      {
        id: 'trusted-circle',
        label: t('nav.trustedCircle'),
        icon: <Users className="w-4 h-4" strokeWidth={1.75} />,
        href: ROUTES.TRUSTED_CIRCLE,
        dataTour: 'nav-trusted-circle',
      },
      {
        id: 'transfer-process',
        label: t('nav.transferProcess'),
        icon: <Clock className="w-4 h-4" strokeWidth={1.75} />,
        href: ROUTES.CONFIGURE_TRANSFER_PROCESS,
        dataTour: 'nav-transfer-process',
      },
    ],
  }
}

function sectionTypeNavIcon(sectionType: string) {
  const lucide = { className: 'w-3.5 h-3.5' as const, strokeWidth: 1.75 as const }
  switch (sectionType) {
    case SECTION_ID.ASSETS:
      return <Wallet {...lucide} />
    case SECTION_ID.POLICIES:
      return <Shield {...lucide} />
    case SECTION_ID.DOCUMENTS:
      return <FileText {...lucide} />
    case SECTION_ID.INSTRUCTIONS:
      return <BookOpenText {...lucide} />
    case SECTION_ID.CONTACTS:
      return <Contact {...lucide} />
    default:
      return <FileText {...lucide} />
  }
}

function buildOwnedEndPlanNav(t: (key: string) => string): { parent: NavLinkLeaf; children: NavLinkLeaf[] } {
  return {
    parent: {
      id: 'my-endplan',
      label: t('nav.vaultSections'),
      icon: <BookOpen className="w-4 h-4" strokeWidth={1.75} />,
      href: endplanSectionPath(SECTION_ID.ASSETS),
      dataTour: 'nav-my-endplan',
    },
    children: [
      {
        id: SECTION_ID.ASSETS,
        label: t('nav.assets'),
        icon: <Wallet className="w-4 h-4" strokeWidth={1.75} />,
        href: endplanSectionPath(SECTION_ID.ASSETS),
      },
      {
        id: SECTION_ID.POLICIES,
        label: t('nav.policies'),
        icon: <Shield className="w-4 h-4" strokeWidth={1.75} />,
        href: endplanSectionPath(SECTION_ID.POLICIES),
      },
      {
        id: SECTION_ID.DOCUMENTS,
        label: t('nav.documents'),
        icon: <FileText className="w-4 h-4" strokeWidth={1.75} />,
        href: endplanSectionPath(SECTION_ID.DOCUMENTS),
      },
      {
        id: SECTION_ID.INSTRUCTIONS,
        label: t('nav.instructions'),
        icon: <BookOpenText className="w-4 h-4" strokeWidth={1.75} />,
        href: endplanSectionPath(SECTION_ID.INSTRUCTIONS),
      },
      {
        id: SECTION_ID.CONTACTS,
        label: t('nav.contacts'),
        icon: <Contact className="w-4 h-4" strokeWidth={1.75} />,
        href: endplanSectionPath(SECTION_ID.CONTACTS),
      },
    ],
  }
}

function AppSidebarPreference({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation()

  if (collapsed) {
    return null
  }

  return (
    <div className="mt-6 shrink-0 border-t border-ep-border-subtle px-2 pt-6 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <span className="typo-body-sm-strong text-ep-body dark:text-white">
          {t('nav.preference')}
        </span>
        <ThemeModeToggle />
      </div>
    </div>
  )
}

function AppSidebarSettings({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  const { t } = useTranslation()

  const settingsItem = useMemo(
    (): NavLinkLeaf => ({
      id: 'settings',
      label: t('nav.settings'),
      icon: <Settings className="h-4 w-4" strokeWidth={1.75} />,
      href: ROUTES.SETTINGS,
    }),
    [t],
  )

  return (
    <div className="shrink-0 border-t border-ep-border-subtle px-2 py-3">
      <SidebarLink item={settingsItem} onNavigate={onNavigate} isCollapsed={collapsed} />
    </div>
  )
}

type AppSidebarProps = {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  mobileDrawerOpen: boolean
  onMobileDrawerOpenChange: (open: boolean) => void
}

export function AppSidebar({
  isCollapsed = false,
  onToggleCollapse,
  mobileDrawerOpen,
  onMobileDrawerOpenChange,
}: AppSidebarProps) {
  const { t } = useTranslation()
  const appVariant = useAppVariant()
  const location = useLocation()
  const [isHoverExpanded, setIsHoverExpanded] = useState(false)
  const collapseTimeoutRef = useRef<number | null>(null)
  const { user, isInitialized, isAuthenticated } = useAuthUser()

  const subscriptionQueryEnabled = isInitialized && isAuthenticated
  const { data: subscriptionResponse, isPending: isSubscriptionQueryPending } = useSubscription({
    enabled: subscriptionQueryEnabled,
  })
  const isSubscriptionPending = subscriptionQueryEnabled && isSubscriptionQueryPending
  /** Invite-only key persons pending free-tier ack; established free-tier users are excluded. */
  const showKeyPersonForOwnerSidebar = isInviteOnlyKeyPersonOnboarding({
    subscriptionLoaded: !isSubscriptionPending,
    keyPersonBillingPendingAck: subscriptionResponse?.keyPersonBillingPendingAck,
    keyPersonEstablishedBeforeInvite: subscriptionResponse?.keyPersonEstablishedBeforeInvite,
  })
  const keyPersonBillingOwnerName = subscriptionResponse?.keyPersonBillingOwnerName ?? ''

  const userVault = useUserVault({
    enabled: !!user && !isSubscriptionPending,
    ownerUserId: user?.id,
  })
  const sharedNavEntries = useSharedVaultSidebarNav({ enabled: !!user && !isSubscriptionPending })

  const routeSharedVaultId = useMemo(() => {
    const m =
      location.pathname.match(/^\/shared-endplan\/([^/]+)/) ??
      location.pathname.match(/^\/shared-vault\/([^/]+)/)
    return m?.[1] ?? null
  }, [location.pathname])

  const [manualExpandedSharedVaultId, setManualExpandedSharedVaultId] = useState<string | null>(null)
  /**
   * When this id matches the current `routeSharedVaultId`, the submenu is user-collapsed.
   * If the route moves to another vault, the id no longer matches and expansion is derived as open.
   */
  const [collapsedRouteVaultId, setCollapsedRouteVaultId] = useState<string | null>(null)

  const isSharedVaultNavExpanded = (vaultId: string) => {
    if (routeSharedVaultId === vaultId) {
      return collapsedRouteVaultId !== vaultId
    }
    return manualExpandedSharedVaultId === vaultId
  }

  const toggleSharedVaultNav = (vaultId: string) => {
    if (routeSharedVaultId === vaultId) {
      setCollapsedRouteVaultId((cur) => (cur === vaultId ? null : vaultId))
      return
    }
    setManualExpandedSharedVaultId((cur) => (cur === vaultId ? null : vaultId))
  }

  const brandLabel = userVault.data?.name?.trim() ? userVault.data.name : t('common.appName')
  const primaryNav = useMemo(() => buildPrimaryNav(t), [t])
  const ownedEndPlanNav = useMemo(() => buildOwnedEndPlanNav(t), [t])

  const isOnOwnedEndplanRoute = useMemo(() => {
    const path = location.pathname
    return path.startsWith('/endplan/') || path === ROUTES.EDIT_ENDPLAN || path === ROUTES.CREATE_ENDPLAN
  }, [location.pathname])

  const [ownedEndPlanCollapsedOnRoute, setOwnedEndPlanCollapsedOnRoute] = useState(false)
  const [ownedEndPlanExpandedOffRoute, setOwnedEndPlanExpandedOffRoute] = useState(true)

  const isOwnedEndPlanNavExpanded = isOnOwnedEndplanRoute
    ? !ownedEndPlanCollapsedOnRoute
    : ownedEndPlanExpandedOffRoute

  const toggleOwnedEndPlanNav = () => {
    if (isOnOwnedEndplanRoute) {
      setOwnedEndPlanCollapsedOnRoute((collapsed) => !collapsed)
      return
    }
    setOwnedEndPlanExpandedOffRoute((expanded) => !expanded)
  }

  const sharedWithMeNavParent = useMemo(
    (): NavLinkLeaf => ({
      id: 'shared-with-me',
      label: t('nav.sharedWithMe'),
      icon: <Users className="w-4 h-4" strokeWidth={1.75} />,
      href: ROUTES.SHARED_WITH_ME,
    }),
    [t],
  )

  const isOnSharedWithMeRoute = useMemo(() => {
    const path = location.pathname
    return (
      path === ROUTES.SHARED_WITH_ME ||
      path.startsWith('/shared-endplan/') ||
      path.startsWith('/shared-vault/')
    )
  }, [location.pathname])

  const [sharedWithMeCollapsedOnRoute, setSharedWithMeCollapsedOnRoute] = useState(false)
  const [sharedWithMeExpandedOffRoute, setSharedWithMeExpandedOffRoute] = useState(true)

  const isSharedWithMeNavExpanded = isOnSharedWithMeRoute
    ? !sharedWithMeCollapsedOnRoute
    : sharedWithMeExpandedOffRoute

  const toggleSharedWithMeNav = () => {
    if (isOnSharedWithMeRoute) {
      setSharedWithMeCollapsedOnRoute((collapsed) => !collapsed)
      return
    }
    setSharedWithMeExpandedOffRoute((expanded) => !expanded)
  }

  const isSidebarLoading = !!user && isSubscriptionPending
  const isRenderCollapsed = isCollapsed && !isHoverExpanded

  const clearCollapseTimeout = () => {
    if (collapseTimeoutRef.current == null) return
    window.clearTimeout(collapseTimeoutRef.current)
    collapseTimeoutRef.current = null
  }

  useEffect(
    () => () => {
      if (collapseTimeoutRef.current == null) return
      window.clearTimeout(collapseTimeoutRef.current)
    },
    [],
  )

  const closeMobile = () => onMobileDrawerOpenChange(false)

  const collapseLabel = isCollapsed ? t('common.expandSidebar') : t('common.collapseSidebar')

  const renderSidebarContent = (collapsed: boolean) => (
    <div className={`flex h-full min-h-0 flex-col${collapsed ? ' overflow-hidden' : ''}`}>
      <div
        className={`box-border flex h-16 min-h-16 max-h-16 shrink-0 items-center shadow-[inset_0_-1px_0_0_var(--ep-border-subtle)] transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:shadow-none ${collapsed ? 'justify-center px-0' : appVariant.id === 'sys' ? 'px-4 pr-5' : 'px-4'}`}
      >
        <Link
          to={ROUTES.DASHBOARD}
          className={`flex min-w-0 items-center transition-[gap] duration-200 ease-out ${collapsed ? 'w-full justify-center gap-0' : 'gap-2'}`}
          title={collapsed ? brandLabel : undefined}
        >
          <AppBrandLogo variant={collapsed ? 'icon' : 'full'} />
        </Link>
      </div>

      <nav
        className={`min-h-0 flex-1 space-y-0 px-2 py-4 ${collapsed ? 'overflow-hidden overscroll-none' : 'overflow-x-hidden overflow-y-auto'}`}
      >
        {isSidebarLoading ? (
          <div className="space-y-4 px-2 animate-pulse">
            <div className="h-8 w-full rounded-lg bg-ep-surface-subtle" />
            <div className="h-8 w-3/4 rounded-lg bg-ep-surface-subtle" />
            <div className="h-8 w-5/6 rounded-lg bg-ep-surface-subtle" />
          </div>
        ) : (
          <>
            {user ? (
              showKeyPersonForOwnerSidebar ? (
                <div
                  className={`
                    px-1 transition-opacity duration-200 ease-out
                    ${collapsed || isSidebarLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                  `}
                  aria-hidden={collapsed || isSidebarLoading}
                >
                  <KeyPersonForOwnerSidebarCard
                    ownerDisplayName={keyPersonBillingOwnerName}
                    isCollapsed={collapsed}
                  />
                </div>
              ) : (
                <AppSidebarProgress isCollapsed={collapsed} />
              )
            ) : null}

            <div className="space-y-0.5">
              {primaryNav.items.map((item) => (
                <SidebarLink
                  key={item.id}
                  item={item}
                  onNavigate={closeMobile}
                  isCollapsed={collapsed}
                />
              ))}
              <SidebarExpandableNavItem
                item={ownedEndPlanNav.parent}
                children={ownedEndPlanNav.children}
                expanded={isOwnedEndPlanNavExpanded}
                onToggleExpand={toggleOwnedEndPlanNav}
                onNavigate={closeMobile}
                isCollapsed={collapsed}
                expandSubNavTitle={t('nav.myEndPlan.expandSubNav')}
                collapseSubNavTitle={t('nav.myEndPlan.collapseSubNav')}
              />
              {!!user && !isSidebarLoading ? (
                <SidebarExpandableNavItem
                  item={sharedWithMeNavParent}
                  children={[]}
                  expanded={isSharedWithMeNavExpanded}
                  onToggleExpand={toggleSharedWithMeNav}
                  onNavigate={closeMobile}
                  isCollapsed={collapsed}
                  subnavActive={isOnSharedWithMeRoute}
                  expandSubNavTitle={t('nav.sharedWithMeNav.expandSubNav')}
                  collapseSubNavTitle={t('nav.sharedWithMeNav.collapseSubNav')}
                  subnavFooter={
                    sharedNavEntries.length > 0 ? (
                      <div className="space-y-0.5">
                        {sharedNavEntries.map(({ vault, sectionTypes, showSubMenu, navHint }) => {
                          const parentItem = {
                            id: `shared-vault-${vault.id}`,
                            label: getSharedVaultDisplayName(vault, t),
                            icon: <Lock className="w-4 h-4" strokeWidth={1.75} />,
                            href: sharedEndplanPath(vault.id),
                            ...(navHint ? { navHint } : {}),
                          }
                          if (!showSubMenu || sectionTypes.length === 0) {
                            return (
                              <SidebarLink
                                key={parentItem.id}
                                item={parentItem}
                                nested
                                onNavigate={closeMobile}
                                isCollapsed={false}
                              />
                            )
                          }
                          const childItems = sectionTypes.map((st) => ({
                            id: `shared-vault-${vault.id}-${st}`,
                            label: t(`nav.${st}`, { defaultValue: st }),
                            icon: sectionTypeNavIcon(st),
                            href: sharedEndplanSectionPath(vault.id, st),
                          }))
                          return (
                            <SidebarExpandableNavItem
                              key={parentItem.id}
                              item={parentItem}
                              children={childItems}
                              expanded={isSharedVaultNavExpanded(vault.id)}
                              onToggleExpand={() => toggleSharedVaultNav(vault.id)}
                              onNavigate={closeMobile}
                              isCollapsed={false}
                            />
                          )
                        })}
                      </div>
                    ) : (
                      <SidebarLink
                        item={{
                          id: 'shared-with-me-hub',
                          label: t('dashboard.sharedWithMe.navItem'),
                          icon: <Users className="w-4 h-4" strokeWidth={1.75} />,
                          href: ROUTES.SHARED_WITH_ME,
                        }}
                        nested
                        onNavigate={closeMobile}
                        isCollapsed={false}
                      />
                    )
                  }
                />
              ) : null}
            </div>

            <AppSidebarPreference collapsed={collapsed} />
          </>
        )}
      </nav>

      <KeyPersonStartOwnEndplanSidebarCard
        enabled={!!user && !isSidebarLoading}
        isCollapsed={collapsed}
        onInteract={closeMobile}
      />

      <AppSidebarSettings collapsed={collapsed} onNavigate={closeMobile} />

      <div
        className={`
          hidden h-12 items-center border-t border-ep-border-subtle lg:flex
          ${collapsed ? 'justify-center px-2' : 'justify-start px-2'}
        `}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`
            inline-flex h-8 w-full items-center rounded-lg text-ep-body/60 transition-colors
            hover:bg-ep-surface-subtle hover:text-ep-body dark:text-white/60 dark:hover:text-white
            ${collapsed ? 'justify-center' : 'justify-start px-3'}
          `}
          aria-label={collapseLabel}
          title={collapseLabel}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <SidebarMobile
        isOpen={mobileDrawerOpen}
        onClose={closeMobile}
        closeAriaLabel={t('common.closeDrawer')}
      >
        {renderSidebarContent(false)}
      </SidebarMobile>

      <SidebarDesktop
        isCollapsed={isRenderCollapsed}
        onMouseEnter={() => {
          if (!isCollapsed) return
          clearCollapseTimeout()
          setIsHoverExpanded(true)
        }}
        onMouseLeave={() => {
          clearCollapseTimeout()
          collapseTimeoutRef.current = window.setTimeout(() => {
            setIsHoverExpanded(false)
          }, 120)
        }}
      >
        {renderSidebarContent(isRenderCollapsed)}
      </SidebarDesktop>
    </>
  )
}
