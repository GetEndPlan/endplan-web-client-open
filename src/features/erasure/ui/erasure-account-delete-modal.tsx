import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ActionDialogFrame, Button, Input, toast } from '@/shared/ui'
import { ROUTES } from '@/app/constants/routes'
import { formatDate } from '@/shared/lib'
import { useLogout } from '@/features/auth'
import { erasureApiMessage } from '../api'
import type { ErasureScheduleResponse } from '../model/types'

type ErasureAccountDeleteModalProps = {
  isOpen: boolean
  userEmail: string
  ownerNotifySummary: string
  isSubmitting: boolean
  onClose: () => void
  onSchedule: () => Promise<ErasureScheduleResponse>
  onScheduled: () => void
}

function emailsMatch(entered: string, expected: string) {
  return entered.trim().toLowerCase() === expected.trim().toLowerCase() && expected.trim().length > 0
}

export function ErasureAccountDeleteModal({
  isOpen,
  userEmail,
  ownerNotifySummary,
  isSubmitting,
  onClose,
  onSchedule,
  onScheduled,
}: ErasureAccountDeleteModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useLogout()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [emailInput, setEmailInput] = useState('')
  const [completion, setCompletion] = useState<ErasureScheduleResponse | null>(null)
  const [prevOpen, setPrevOpen] = useState<boolean | null>(null)
  if (prevOpen === null || isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setStep(1)
      setEmailInput('')
      setCompletion(null)
    }
  }

  if (!isOpen) return null

  const handleClose = isSubmitting || logout.isPending ? () => {} : onClose

  const handleDeleteMyAccount = async () => {
    if (!emailsMatch(emailInput, userEmail)) return
    try {
      const res = await onSchedule()
      setCompletion(res)
      setStep(3)
      onScheduled()
    } catch (e) {
      toast.error(erasureApiMessage(e) ?? t('settings.erasure.toast.scheduleError'))
    }
  }

  const handleSignOut = async () => {
    try {
      await logout.mutateAsync()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch {
      // session layer may surface errors; still send user to login
      navigate(ROUTES.LOGIN, { replace: true })
    }
  }

  const scheduledLabel =
    completion?.scheduledExecuteAt && completion.scheduledExecuteAt.trim() !== ''
      ? formatDate(completion.scheduledExecuteAt)
      : ''
  const confirmEmail = (completion?.confirmationEmailTo ?? userEmail).trim()

  if (step === 1) {
    return (
      <ActionDialogFrame
        title={t('settings.erasure.accountModal.step1.title')}
        subtitle={t('settings.erasure.accountModal.step1.subtitle')}
        description={
          <div className="space-y-4">
            <div className="rounded-lg border border-ep-border-subtle bg-ep-surface p-4">
              <p className="typo-body-sm-emphasis uppercase tracking-wide text-ep-body">
                {t('settings.erasure.accountModal.step1.loseTitle')}
              </p>
              <ul className="mt-3 list-none space-y-2.5 pl-0">
                {(['loseItem1', 'loseItem2', 'loseItem3', 'loseItem4'] as const).map((key) => (
                  <li key={key} className="flex gap-2 typo-body-sm text-slate-700 dark:text-slate-200">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-500 dark:bg-slate-400" aria-hidden />
                    <span>{t(`settings.erasure.accountModal.step1.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-ep-border-subtle bg-ep-surface p-4">
              <p className="typo-body-sm-emphasis text-ep-body">
                {t('settings.erasure.accountModal.step1.keyPersonTitle')}
              </p>
              <p className="mt-2 typo-body-sm text-slate-700 dark:text-slate-200">{ownerNotifySummary}</p>
            </div>
          </div>
        }
        onClose={handleClose}
        icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} />}
        tone="default"
        maxWidthClassName="max-w-lg"
        showCloseButton
        closeButtonLabel={t('common.close')}
        isCloseDisabled={isSubmitting}
      >
        <div className="flex flex-col-reverse gap-3 px-4 pb-4 sm:flex-row sm:justify-end sm:px-5 sm:pb-5">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('settings.erasure.accountModal.step1.keepAccount')}
          </Button>
          <Button variant="danger" disabled={isSubmitting} onClick={() => setStep(2)}>
            {t('settings.erasure.accountModal.step1.continue')}
          </Button>
        </div>
      </ActionDialogFrame>
    )
  }

  if (step === 2) {
    const canSubmit = emailsMatch(emailInput, userEmail) && !isSubmitting
    return (
      <ActionDialogFrame
        title={t('settings.erasure.accountModal.step2.title')}
        description={<p>{t('settings.erasure.accountModal.step2.intro')}</p>}
        onClose={handleClose}
        icon={<Mail className="h-5 w-5" strokeWidth={2.2} />}
        tone="danger"
        maxWidthClassName="max-w-lg"
        showCloseButton
        closeButtonLabel={t('common.close')}
        isCloseDisabled={isSubmitting}
      >
        <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="space-y-1.5">
            <label
              htmlFor="erasure-account-confirm-email"
              className="block typo-body-sm-emphasis text-red-600 dark:text-red-400"
            >
              {t('settings.erasure.accountModal.step2.confirmLabel', { email: userEmail })}
            </label>
            <Input
              id="erasure-account-confirm-email"
              type="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={t('settings.erasure.accountModal.step2.emailPlaceholder')}
              disabled={isSubmitting}
              aria-required
            />
          </div>
          <p className="typo-body-sm text-slate-500 dark:text-slate-400">{t('settings.erasure.accountModal.step2.footerNote')}</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" disabled={!canSubmit} loading={isSubmitting} onClick={() => void handleDeleteMyAccount()}>
              {t('settings.erasure.accountModal.step2.submit')}
            </Button>
          </div>
        </div>
      </ActionDialogFrame>
    )
  }

  return (
    <ActionDialogFrame
      title={t('settings.erasure.accountModal.step3.title')}
      description={
        <div className="rounded-lg border border-ep-border-subtle bg-ep-surface p-4 text-left">
          <p className="typo-body-sm-emphasis text-ep-body">
            {t('settings.erasure.accountModal.step3.deletionDate', { date: scheduledLabel })}
          </p>
          <p className="mt-2 typo-body-sm text-slate-700 dark:text-slate-200">
            {t('settings.erasure.accountModal.step3.body', { email: confirmEmail })}
          </p>
        </div>
      }
      onClose={logout.isPending ? () => {} : onClose}
      icon={<CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />}
      tone="default"
      maxWidthClassName="max-w-md"
      showCloseButton
      closeButtonLabel={t('common.close')}
      isCloseDisabled={logout.isPending}
    >
      <div className="flex justify-center px-4 pb-4 sm:px-5 sm:pb-5">
        <Button
          type="button"
          variant="primary"
          className="min-w-[200px] bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:focus-visible:outline-slate-200"
          loading={logout.isPending}
          onClick={() => void handleSignOut()}
        >
          {t('settings.erasure.accountModal.step3.signOut')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
