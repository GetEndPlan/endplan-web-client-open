import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { verificationApi } from '@/features/auth'
import {
  releaseApi,
  type PostReleaseRecoveryDecision,
} from '../../api/clients/release-api'

const CODE_LENGTH = 6

type UsePostReleaseRecoveryFlowParams = {
  email: string
  userName: string
  inactivityPeriodDays?: number | null
  accessNowKeyPersonNames?: string[]
  onCompleted: (decision: PostReleaseRecoveryDecision) => Promise<void> | void
}

export function usePostReleaseRecoveryFlow({
  email,
  userName,
  inactivityPeriodDays = null,
  accessNowKeyPersonNames = [],
  onCompleted,
}: UsePostReleaseRecoveryFlowParams) {
  const { t, i18n } = useTranslation()

  const [step, setStep] = useState(1)
  const [code, setCode] = useState(Array(CODE_LENGTH).fill('') as string[])
  const [countdown, setCountdown] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [isResolvingDecision, setIsResolvingDecision] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [stepOneError, setStepOneError] = useState<string | null>(null)
  const [decisionError, setDecisionError] = useState<string | null>(null)
  const [verificationCodeSent, setVerificationCodeSent] = useState(false)

  const verificationCode = useMemo(() => code.join(''), [code])
  const canVerify = code.every((digit) => digit.trim().length === 1)

  useEffect(() => {
    if (countdown <= 0) return

    const timer = window.setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => { window.clearTimeout(timer) }
  }, [countdown])

  const sendCode = useCallback(async (isResend: boolean) => {
    if (!email || isSendingCode) return

    setIsSendingCode(true)
    setStepOneError(null)

    try {
      if (isResend) {
        await verificationApi.resendCode({ email, type: 'post_release_recovery' })
      } else {
        await verificationApi.sendCode({ email, type: 'post_release_recovery' })
      }
      setStatusMessage(t('dashboard.recovery.flow.step1.codeSent'))
      setCountdown(60)
      setVerificationCodeSent(true)
    } catch (error) {
      setStepOneError(error instanceof Error ? error.message : t('dashboard.recovery.flow.step1.sendFailed'))
    } finally {
      setIsSendingCode(false)
    }
  }, [email, isSendingCode, t])

  const verifyCode = useCallback(async () => {
    if (!canVerify || isVerifyingCode) return

    setIsVerifyingCode(true)
    setStepOneError(null)

    try {
      const result = await verificationApi.verifyCode({
        email,
        code: verificationCode,
        type: 'post_release_recovery',
      })
      if (result.verified) {
        setStatusMessage(null)
        setStep(2)
      }
    } catch (error) {
      setCode(Array(CODE_LENGTH).fill(''))
      setStepOneError(error instanceof Error ? error.message : t('dashboard.recovery.flow.step1.verifyFailed'))
    } finally {
      setIsVerifyingCode(false)
    }
  }, [canVerify, email, isVerifyingCode, t, verificationCode])

  const resolveDecision = useCallback(async (decision: PostReleaseRecoveryDecision) => {
    if (isResolvingDecision) return

    setIsResolvingDecision(true)
    setDecisionError(null)

    try {
      await releaseApi.resolvePostReleaseRecovery({ decision })
      await onCompleted(decision)
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : t('dashboard.recovery.flow.step3.resolveFailed'))
    } finally {
      setIsResolvingDecision(false)
    }
  }, [isResolvingDecision, onCompleted, t])

  const goToStep3 = useCallback(() => setStep(3), [])

  const displayName = userName.trim()
  const FALLBACK_INACTIVITY_DAYS = 60
  const inactivityDaysForCopy = inactivityPeriodDays ?? FALLBACK_INACTIVITY_DAYS

  const keyPersonListLabel = useMemo(() => {
    if (accessNowKeyPersonNames.length === 0) return ''
    return new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' }).format(
      accessNowKeyPersonNames,
    )
  }, [accessNowKeyPersonNames, i18n.language])

  return {
    t,
    step,
    code,
    setCode,
    countdown,
    isSendingCode,
    isVerifyingCode,
    isResolvingDecision,
    statusMessage,
    stepOneError,
    decisionError,
    verificationCodeSent,
    canVerify,
    displayName,
    inactivityDaysForCopy,
    keyPersonListLabel,
    accessNowKeyPersonNames,
    email,
    sendCode,
    verifyCode,
    resolveDecision,
    goToStep3,
  }
}
