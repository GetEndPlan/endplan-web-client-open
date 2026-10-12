import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES, invitePath } from '@/app/constants/routes'

type UseSignupPageResult = {
  inviteEmail: string
  inviteName: string
  inviteToken: string
  handleSuccess: () => void
}

export function useSignupPage(): UseSignupPageResult {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const inviteEmail = searchParams.get('email') ?? ''
  const inviteName = searchParams.get('name') ?? ''
  const inviteToken = searchParams.get('invite') ?? ''

  const handleSuccess = useCallback(() => {
    if (inviteToken) {
      navigate(invitePath(inviteToken), { replace: true })
      return
    }

    navigate(ROUTES.VERIFY_EMAIL, { replace: true })
  }, [inviteToken, navigate])

  return {
    inviteEmail,
    inviteName,
    inviteToken,
    handleSuccess,
  }
}
