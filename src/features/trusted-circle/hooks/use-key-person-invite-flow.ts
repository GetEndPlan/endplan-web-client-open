import { useState } from 'react'
import { toast } from '@/shared/ui'
import type { CreateInvitationRequest, Invitation } from '../api'
import { inviteEmailFieldError, isValidInviteEmail } from '../model/email-format'
import { isValidOptionalPhoneNumber } from '../model/phone-format'

const TOTAL_STEPS = 3

type UseKeyPersonInviteFlowParams = {
  onSend: (data: CreateInvitationRequest) => Promise<Invitation>
  onClose: () => void
  t: (key: string) => string
}

export function useKeyPersonInviteFlow({ onSend, onClose, t }: UseKeyPersonInviteFlowParams) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [accessTiming, setAccessTiming] = useState<'now' | 'in_end'>('now')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [showEmailRequired, setShowEmailRequired] = useState(false)

  const clearError = () => {
    setError(null)
    setPhoneError(null)
  }

  const isStep1Complete = name.trim().length > 0 && isValidInviteEmail(email)
  const canGoNext = step === 1 ? isStep1Complete : true
  const canSubmit = isStep1Complete

  const emailError = inviteEmailFieldError(
    email,
    {
      required: t('trustedCircle.inviteForm.emailRequired'),
      invalid: t('trustedCircle.inviteForm.emailInvalid'),
    },
    showEmailRequired,
  )

  const validatePhone = () => {
    if (isValidOptionalPhoneNumber(phone)) {
      setPhoneError(null)
      return true
    }
    setPhoneError(t('trustedCircle.inviteForm.phoneInvalid'))
    return false
  }

  const validateStep1 = () => {
    if (!name.trim()) {
      setError(t('trustedCircle.inviteForm.nameRequired'))
      return false
    }
    if (!email.trim()) {
      setShowEmailRequired(true)
      return false
    }
    if (!isValidInviteEmail(email)) {
      return false
    }
    return true
  }

  const goNext = () => {
    clearError()
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validatePhone()) return
    if (step < TOTAL_STEPS) setStep((s) => s + 1)
  }

  const goBack = () => {
    clearError()
    if (step > 1) setStep((s) => s - 1)
  }

  const handlePhoneBlur = () => {
    if (phone.trim().length === 0) {
      setPhoneError(null)
      return
    }
    validatePhone()
  }

  const handleSend = async () => {
    clearError()
    if (!validateStep1()) {
      setStep(1)
      return
    }
    if (!validatePhone()) {
      setStep(2)
      return
    }

    setLoading(true)
    try {
      const invitation = await onSend({
        inviteeEmail: email.trim(),
        inviteeName: name.trim(),
        relationship: relationship.trim() || undefined,
        phone: phone.trim() || undefined,
        role: 'key_person',
        accessTiming,
        message: message.trim() || undefined,
      })

      toast.success(t('trustedCircle.inviteForm.success'))
      if (invitation.token) {
        const inviteLink = `${window.location.origin}/invite/${invitation.token}`
        navigator.clipboard.writeText(inviteLink)
        toast.info(t('trustedCircle.inviteForm.linkCopied'))
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return {
    step,
    totalSteps: TOTAL_STEPS,
    email,
    setEmail: (value: string) => {
      setEmail(value)
      if (value.trim().length > 0) {
        setShowEmailRequired(false)
      }
    },
    name,
    setName,
    relationship,
    setRelationship,
    phone,
    setPhone: (value: string) => {
      setPhone(value)
      setPhoneError(null)
    },
    message,
    setMessage,
    accessTiming,
    setAccessTiming,
    loading,
    error,
    emailError,
    phoneError,
    handlePhoneBlur,
    canGoNext,
    canSubmit,
    goNext,
    goBack,
    handleSend,
    onClose,
  }
}
