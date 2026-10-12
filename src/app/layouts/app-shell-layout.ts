export const APP_SHELL_HEADER_HEIGHT = '4rem'
export const APP_SHELL_SIDEBAR_WIDTH_EXPANDED = '16rem'
export const APP_SHELL_SIDEBAR_WIDTH_COLLAPSED = '4rem'

export function appShellSidebarWidth(isCollapsed: boolean): string {
  return isCollapsed ? APP_SHELL_SIDEBAR_WIDTH_COLLAPSED : APP_SHELL_SIDEBAR_WIDTH_EXPANDED
}
