import { createContext } from 'react'

export type MobileDrawerContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const MobileDrawerContext = createContext<MobileDrawerContextValue | null>(null)
