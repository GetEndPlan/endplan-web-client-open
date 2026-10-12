import { useContext } from 'react'
import { MobileDrawerContext, type MobileDrawerContextValue } from '../mobile-drawer-context'

export function useMobileDrawer(): MobileDrawerContextValue {
  const v = useContext(MobileDrawerContext)
  if (v == null) {
    throw new Error('useMobileDrawer must be used within MobileDrawerProvider')
  }
  return v
}
