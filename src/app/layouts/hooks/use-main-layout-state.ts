import { useAuthUser } from '@/features/auth/session'
import { useShellSidebarState } from './use-shell-sidebar-state'
import { useTrialBannerState } from './use-trial-banner-state'
import { useUnlockGate } from './use-unlock-gate'

export function useMainLayoutState() {
  const { user } = useAuthUser()

  const {
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    openMobileDrawer,
    closeMobileDrawer,
  } = useShellSidebarState()
  const { planBadge, dismissPlanBadge } = useTrialBannerState()
  const { needsUnlock } = useUnlockGate({ enabled: !!user })

  return {
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    openMobileDrawer,
    closeMobileDrawer,
    planBadge,
    dismissPlanBadge,
    needsUnlock,
  }
}
