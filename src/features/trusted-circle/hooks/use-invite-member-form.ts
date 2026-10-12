import { useState } from 'react'
import { toast } from '@/shared/ui'
import type { CreateInvitationRequest, Invitation, UserRole } from '../api'
import { VAULT_SECTION_TYPES } from '../ui/shared/role-config'
import type { ExtendedUserRole } from '../ui/shared/role-config'
import { inviteEmailFieldError, isValidInviteEmail } from '../model/email-format'
import { isValidOptionalPhoneNumber } from '../model/phone-format'
import { isVisibleVaultSectionType } from '@/features/endplan/model'

type UseInviteMemberFormParams = {
  role: ExtendedUserRole
  onSend: (data: CreateInvitationRequest) => Promise<Invitation>
  onClose: () => void
  t: (key: string) => string
  sectionsGranted?: string[]
  sectionItemsGrantedMax?: number
}

export function useInviteMemberForm({
  role,
  onSend,
  onClose,
  t,
  sectionsGranted,
  sectionItemsGrantedMax,
}: UseInviteMemberFormParams) {
  const selectableSectionTypes = (
    sectionsGranted?.length ? sectionsGranted : Array.from(VAULT_SECTION_TYPES)
  ).filter(isVisibleVaultSectionType)
  const maxSections = sectionItemsGrantedMax ?? selectableSectionTypes.length
  const mappedRole: UserRole = role === 'trustee' ? 'key_person' : role as UserRole
  const showAccessTimingSelector = mappedRole === 'key_person'
  const showSectionSelector = mappedRole !== 'key_person' && mappedRole !== 'recipient'

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [accessTiming, setAccessTiming] = useState<'now' | 'in_end'>('now')
  const [allowedSectionTypes, setAllowedSectionTypes] = useState<string[]>(
    showSectionSelector ? selectableSectionTypes.slice(0, maxSections) : []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [showEmailRequired, setShowEmailRequired] = useState(false)

  const emailError = inviteEmailFieldError(
    email,
    {
      required: t('trustedCircle.inviteForm.emailRequired'),
      invalid: t('trustedCircle.inviteForm.emailInvalid'),
    },
    showEmailRequired,
  )

  const toggleSectionType = (sectionType: string) => {
    setAllowedSectionTypes((prev) => {
      if (prev.includes(sectionType)) return prev.filter((s) => s !== sectionType)
      if (prev.length >= maxSections) return prev
      return [...prev, sectionType]
    })
  }

  const handleSend = async () => {
    setError(null)
    setPhoneError(null)
    if (!name.trim()) { setError(t('trustedCircle.inviteForm.nameRequired')); return }
    if (!email.trim()) {
      setShowEmailRequired(true)
      return
    }
    if (!isValidInviteEmail(email)) {
      return
    }
    if (!isValidOptionalPhoneNumber(phone)) {
      setPhoneError(t('trustedCircle.inviteForm.phoneInvalid'))
      return
    }

    setLoading(true)
    try {
      const invitation = await onSend({
        inviteeEmail: email.trim(),
        inviteeName: name.trim(),
        relationship: relationship.trim() || undefined,
        phone: phone.trim() || undefined,
        role: mappedRole,
        accessTiming: showAccessTimingSelector ? accessTiming : undefined,
        message: message.trim() || undefined,
        allowedSectionTypes: showSectionSelector
          ? (allowedSectionTypes.length > 0 ? allowedSectionTypes : selectableSectionTypes.slice(0, maxSections))
          : undefined,
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
    allowedSectionTypes,
    toggleSectionType,
    loading,
    error,
    emailError,
    phoneError,
    mappedRole,
    showAccessTimingSelector,
    showSectionSelector,
    selectableSectionTypes,
    maxSections,
    handleSend,
  }
}
