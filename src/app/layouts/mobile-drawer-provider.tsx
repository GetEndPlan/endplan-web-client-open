import { type ReactNode } from 'react'
import { MobileDrawerContext, type MobileDrawerContextValue } from './mobile-drawer-context'

export function MobileDrawerProvider({
  value,
  children,
}: {
  value: MobileDrawerContextValue
  children: ReactNode
}) {
  return <MobileDrawerContext.Provider value={value}>{children}</MobileDrawerContext.Provider>
}
