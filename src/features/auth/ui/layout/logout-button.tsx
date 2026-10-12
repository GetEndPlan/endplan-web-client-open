import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import { useLogout } from '../../session'

type LogoutButtonProps = {
  onSuccess?: () => void
}

export function LogoutButton({ onSuccess }: LogoutButtonProps) {
  const { t } = useTranslation()
  const logoutMutation = useLogout()

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    onSuccess?.()
  }

  return (
    <Button variant="ghost" onClick={handleLogout} loading={logoutMutation.isPending}>
      {logoutMutation.isPending ? t('auth.logout.loggingOut') : t('auth.logout.button')}
    </Button>
  )
}
