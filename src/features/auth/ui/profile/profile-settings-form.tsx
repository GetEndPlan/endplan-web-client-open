import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Button, Input } from '@/shared/ui'
import { Camera } from 'lucide-react'
import { useProfile } from '../../api/hooks/user-hooks'
import { useProfileSettings } from '../../hooks/use-profile-settings'
import type { User } from '@/entities/user'

const PROFILE_AVATAR_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'

export function ProfileSettingsForm() {
  const { t } = useTranslation()

  const { data: profile, isLoading: loadingProfile } = useProfile()
  const user = profile?.user ?? null

  if (loadingProfile) {
    return (
      <Card className="p-6 min-h-[200px] flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400">{t('common.loading')}</div>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-slate-600 dark:text-slate-400">{t('settings.profileLoadError')}</p>
      </Card>
    )
  }

  return <ProfileSettingsEditor key={profileSnapshotKey(user)} user={user} />
}

type ProfileSettingsEditorProps = {
  user: User
}

function ProfileSettingsEditor({ user }: ProfileSettingsEditorProps) {
  const { t } = useTranslation()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const {
    name,
    setName,
    phone,
    setPhone,
    country,
    setCountry,
    dirty,
    isSaving,
    isUploadingAvatar,
    handleSave,
    handleCancel,
    handleAvatarUpload,
  } = useProfileSettings(user)

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    void handleAvatarUpload(file)
  }

  return (
    <Card className="p-6">
      <h2 className="typo-heading-card text-slate-900 dark:text-slate-100 mb-6">
        {t('settings.profileInformation')}
      </h2>

      <div className="flex flex-col sm:flex-row gap-8">
        <div className="flex flex-col items-center gap-3">
          <input
            ref={avatarInputRef}
            type="file"
            accept={PROFILE_AVATAR_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={handleAvatarFileChange}
          />
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-ep-surface-subtle overflow-hidden flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="typo-heading-accent">
                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            loading={isUploadingAvatar}
            disabled={isUploadingAvatar}
            onClick={() => avatarInputRef.current?.click()}
          >
            <Camera className="w-4 h-4" />
            {t('settings.changePhoto')}
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label={t('settings.fullName')}
              placeholder={t('settings.fullNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label={t('settings.email')}
              type="email"
              placeholder={t('settings.emailPlaceholder')}
              value={user.email}
              disabled
              className="bg-slate-50 dark:bg-ep-surface-panel cursor-not-allowed"
            />
          </div>
          <div>
            <Input
              label={t('settings.phoneNumber')}
              type="tel"
              placeholder={t('settings.phoneNumberPlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Input
              label={t('settings.country')}
              placeholder={t('settings.countryPlaceholder')}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-ep-border-card">
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={!dirty || isSaving}
        >
          {t('settings.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          loading={isSaving}
          disabled={!dirty}
        >
          {t('settings.saveChanges')}
        </Button>
      </div>
    </Card>
  )
}

function profileSnapshotKey(user: User): string {
  return `${user.id}:${user.name ?? ''}:${user.phone ?? ''}:${user.country ?? ''}:${user.imageUrl ?? ''}`
}
