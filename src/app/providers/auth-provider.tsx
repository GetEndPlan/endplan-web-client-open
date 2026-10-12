import type { ReactNode } from 'react'
import { useAuthUser } from '@/features/auth/session'
import { FullPageSpinner } from '@/shared/ui'
import { usePostResetCleanup } from './hooks/use-post-reset-cleanup'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isInitialized, user } = useAuthUser()

  usePostResetCleanup({ userId: user?.id })

  if (!isInitialized) {
    return <FullPageSpinner />
  }

  return <>{children}</>
}
