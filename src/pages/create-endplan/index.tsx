import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { toast } from '@/shared/ui'
import {
  EndPlanForm,
  useUserVault,
  useCreateEndPlanForm,
} from '@/features/endplan'
import {
  useKeyMaterial,
  EncryptionKeysRequired
} from '@/features/keys'
import { useAuthUser } from '@/features/auth/session'

export function CreateEndPlanPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { user } = useAuthUser()

  const { data: vault, isLoading: isVaultLoading, isResolved: isVaultResolved } = useUserVault({
    ownerUserId: user?.id,
  })

  const { publicKeyB64, pqPublicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({ enabled: !!user })

  const {
    name,
    setName,
    description,
    setDescription,
    content,
    setContent,
    error,
    limitReached,
    isSubmitting,
    handleSubmit,
  } = useCreateEndPlanForm({
    vault: vault ?? null,
    isVaultResolved,
    publicKeyB64,
    pqPublicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
    ownerId: user?.id,
    onSuccess: () => {
      toast.success(t('endplan.create.success'))
      navigate(ROUTES.DASHBOARD)
    },
  })

  // Show error if no keys
  if (!publicKeyB64) {
    return <EncryptionKeysRequired />
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.backToDashboard')}
          </button>
        </div>

        <EndPlanForm
          translationPrefix="endplan.create"
          name={name}
          description={description}
          content={content}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onContentChange={setContent}
          isSaving={isSubmitting || isVaultLoading}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTES.DASHBOARD)}
        />
        {limitReached && (
          <p className="mt-3 typo-body-sm text-amber-600 dark:text-amber-400">
            <Link to={ROUTES.BILLING} className="underline typo-emphasis">{t('endplan.create.upgradeNoticePrefix')}</Link>{' '}
            {t('endplan.create.upgradeNoticeSuffix')}
          </p>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="typo-body-sm text-blue-800 dark:text-blue-200">
              <p className="typo-emphasis mb-1">{t('endplan.encryption.title')}</p>
              <p>{t('endplan.encryption.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
