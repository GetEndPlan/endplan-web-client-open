import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { verificationApi } from '../api/verification-api'
import { useAuthUser, useLogout, useMarkEmailVerified } from '../session'

export function useVerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthUser()
  const markEmailVerified = useMarkEmailVerified()
  const logout = useLogout()

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN)
      return
    }
    if (user?.emailVerified) {
      navigate(ROUTES.DASHBOARD)
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    if (countdown <= 0) {
      return
    }

    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const resendCode = async () => {
    if (!user?.email || countdown > 0) {
      return
    }

    setIsSending(true)
    setError(null)

    try {
      await verificationApi.resendCode({
        email: user.email,
        type: 'email',
      })
      setSuccess(t('auth.verify.codeSent'))
      setCountdown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.verify.resendFailed'))
    } finally {
      setIsSending(false)
    }
  }

  const verifyCode = async (verificationCode: string) => {
    if (!user?.email || submittingRef.current) {
      return
    }
    submittingRef.current = true

    setIsLoading(true)
    setError(null)

    try {
      const result = await verificationApi.verifyCode({
        email: user.email,
        code: verificationCode,
        type: 'email',
      })

      if (result.verified) {
        setSuccess(t('auth.verify.success'))
        markEmailVerified()
        setTimeout(() => navigate(ROUTES.DASHBOARD), 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.verify.invalidCode'))
      setCode(['', '', '', '', '', ''])
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  const logoutAndRetry = async () => {
    await logout.mutateAsync()
    navigate(ROUTES.LOGIN)
  }

  return {
    user,
    code,
    isLoading,
    isSending,
    error,
    success,
    countdown,
    canVerify: code.every((digit) => !!digit),
    setCode,
    resendCode,
    verifyCode,
    logoutAndRetry,
  }
}
