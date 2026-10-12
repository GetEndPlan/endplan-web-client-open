import { useCallback, useEffect, useState } from 'react'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'endplan-sidebar-collapsed'

function readInitialSidebarCollapsedState(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
}

export function useShellSidebarState() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(readInitialSidebarCollapsedState)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev)
  }, [])

  const openMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(true)
  }, [])

  const closeMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false)
  }, [])

  return {
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    openMobileDrawer,
    closeMobileDrawer,
  }
}

