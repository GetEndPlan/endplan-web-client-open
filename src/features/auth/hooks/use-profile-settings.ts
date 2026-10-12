import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/shared/ui'
import { ApiError } from '@/shared/api/client'
import { useUpdateProfile, useUploadProfileAvatar } from '../api/hooks/user-hooks'
import type { User } from '@/entities/user'

const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024
const PROFILE_AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const

export function useProfileSettings(user: User) {
  const { t } = useTranslation()
  const updateProfileMutation = useUpdateProfile()
  const uploadAvatarMutation = useUploadProfileAvatar()

  const [name, setName] = useState(user.name ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [country, setCountry] = useState(user.country ?? '')

  const dirty =
    (user.name ?? '') !== name ||
    (user.phone ?? '') !== phone ||
    (user.country ?? '') !== country

  const handleSave = async () => {
    if (!dirty) return
    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
        country: country.trim() || undefined,
      })
      toast.success(t('settings.saveSuccess'))
    } catch {
      toast.error(t('settings.saveError'))
    }
  }

  const handleCancel = () => {
    setName(user.name ?? '')
    setPhone(user.phone ?? '')
    setCountry(user.country ?? '')
  }

  const handleAvatarUpload = async (file: File) => {
    if (file.size > PROFILE_AVATAR_MAX_BYTES) {
      toast.error(t('settings.avatarUploadTooLarge'))
      return
    }
    if (!PROFILE_AVATAR_ALLOWED_TYPES.includes(file.type as (typeof PROFILE_AVATAR_ALLOWED_TYPES)[number])) {
      toast.error(t('settings.avatarUploadInvalidType'))
      return
    }

    try {
      await uploadAvatarMutation.mutateAsync(file)
      toast.success(t('settings.avatarUploadSuccess'))
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = err.apiMessage?.trim()
        if (msg) {
          toast.error(msg)
          return
        }
        if (err.status === 503) {
          toast.error(t('settings.avatarUploadStorageUnavailable'))
          return
        }
      }
      toast.error(t('settings.avatarUploadError'))
    }
  }

  return {
    name,
    setName,
    phone,
    setPhone,
    country,
    setCountry,
    dirty,
    isSaving: updateProfileMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    handleSave,
    handleCancel,
    handleAvatarUpload,
  }
}
