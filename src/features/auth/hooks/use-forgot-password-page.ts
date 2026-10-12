import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { verificationApi } from '../api/verification-api'
import { authApi } from '../api/auth-api'
import { meetsPasswordPolicy, PASSWORD_MIN_LENGTH } from '../model/schemas'

export function useForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (countdown <= 0) {
      return
    }

    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const resetToCodeStep = () => {
    setStep(2)
    setNewPassword('')
    setConfirmPassword('')
    setSuccess(null)
  }

  const sendCode = async () => {
    if (!email.trim()) {
      return
    }

    setIsSending(true)
    setError(null)
    setSuccess(null)

    try {
      await verificationApi.sendCode({
        email: email.trim().toLowerCase(),
        type: 'password_reset',
      })
      setCode(['', '', '', '', '', ''])
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(t('auth.forgotPassword.codeSent'))
      setStep(2)
      setCountdown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setIsSending(false)
    }
  }

  const resendCode = async () => {
    if (!email || countdown > 0) {
      return
    }

    setIsSending(true)
    setError(null)

    try {
      await verificationApi.resendCode({
        email: email.trim().toLowerCase(),
        type: 'password_reset',
      })
      setCode(['', '', '', '', '', ''])
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(t('auth.forgotPassword.codeSent'))
      resetToCodeStep()
      setCountdown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setIsSending(false)
    }
  }

  const verifyCode = async (verificationCode: string) => {
    const codeStr = verificationCode || code.join('')
    if (!email.trim() || codeStr.length !== 6 || submittingRef.current) {
      return
    }
    submittingRef.current = true

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await verificationApi.checkCode({
        email: email.trim().toLowerCase(),
        code: codeStr,
        type: 'password_reset',
      })

      if (result.verified) {
        setSuccess(t('auth.forgotPassword.codeVerified'))
        setStep(3)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgotPassword.invalidCode'))
      setCode(['', '', '', '', '', ''])
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  const resetPassword = async () => {
    const codeStr = code.join('')
    if (!email || codeStr.length !== 6 || !newPassword || newPassword !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'))
      return
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(t('auth.errors.passwordMin'))
      return
    }
    if (!meetsPasswordPolicy(newPassword)) {
      setError(t('auth.errors.passwordRequirements'))
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await authApi.resetPasswordWithCode({
        email: email.trim().toLowerCase(),
        code: codeStr,
        newPassword,
      })
      setSuccess(t('auth.forgotPassword.success'))
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { state: { message: 'Password reset successfully' } })
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgotPassword.invalidCode'))
      setCode(['', '', '', '', '', ''])
      resetToCodeStep()
    } finally {
      setIsLoading(false)
    }
  }

  const passwordMatch = !confirmPassword || newPassword === confirmPassword
  const canVerifyCode = code.every((digit) => digit)
  const canSubmitPassword =
    meetsPasswordPolicy(newPassword) && confirmPassword.length > 0 && passwordMatch

  return {
    step,
    email,
    code,
    newPassword,
    confirmPassword,
    isLoading,
    isSending,
    error,
    success,
    countdown,
    passwordMatch,
    canVerifyCode,
    canSubmitPassword,
    setEmail,
    setCode,
    setNewPassword,
    setConfirmPassword,
    sendCode,
    resendCode,
    verifyCode,
    resetPassword,
  }
}
