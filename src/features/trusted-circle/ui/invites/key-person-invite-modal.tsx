import type { ReactNode } from 'react'
import { Check, Eye, Lock, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Input, ModalOverlay } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import type { CreateInvitationRequest, Invitation } from '../../api'
import { useKeyPersonInviteFlow } from '../../hooks/use-key-person-invite-flow'

type KeyPersonInviteModalProps = {
  onClose: () => void
  onSend: (data: CreateInvitationRequest) => Promise<Invitation>
}

type StepHeaderProps = {
  step: number
  totalSteps: number
  title: string
  subtitle: string
  onClose: () => void
}

function StepHeader({ step, totalSteps, title, subtitle, onClose }: StepHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="typo-caption-emphasis text-ep-primary dark:text-ep-primary-accent">
          {t('trustedCircle.keyPersonInvite.stepLabel', { current: step, total: totalSteps })}
        </p>
        <h2 className="mt-2 typo-heading-card text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-ep-surface-panel dark:hover:text-slate-300"
        aria-label={t('common.close')}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

type AccessTimingOptionProps = {
  value: 'now' | 'in_end'
  selected: boolean
  title: string
  description: string
  icon: ReactNode
  onSelect: () => void
}

function AccessTimingOption({ value, selected, title, description, icon, onSelect }: AccessTimingOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={title}
      data-value={value}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors',
        selected
          ? 'border-ep-primary bg-ep-primary-softer/80 dark:border-ep-primary-accent dark:bg-ep-primary-dark/25'
          : 'border-ep-border-card bg-ep-surface hover:border-ep-border-subtle',
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
          selected
            ? 'bg-ep-primary-softer text-ep-primary dark:bg-ep-primary-dark/50 dark:text-ep-primary-muted'
            : 'bg-ep-surface-subtle text-ep-body-muted',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="typo-body-sm-emphasis text-slate-900 dark:text-slate-100">{title}</p>
        <p className="mt-1 typo-body-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
          selected
            ? 'border-ep-primary bg-ep-primary dark:border-ep-primary-accent dark:bg-ep-primary'
            : 'border-slate-300 bg-transparent dark:border-slate-500',
        )}
        aria-hidden
      >
        {selected ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
      </div>
    </button>
  )
}

export function KeyPersonInviteModal({ onClose, onSend }: KeyPersonInviteModalProps) {
  const { t } = useTranslation()
  const flow = useKeyPersonInviteFlow({ onSend, onClose, t })

  const stepContent = (() => {
    switch (flow.step) {
      case 1:
        return (
          <>
            <StepHeader
              step={1}
              totalSteps={flow.totalSteps}
              title={t('trustedCircle.keyPersonInvite.step1.title')}
              subtitle={t('trustedCircle.keyPersonInvite.step1.subtitle')}
              onClose={flow.onClose}
            />
            <div className="space-y-4">
              <Input
                label={t('trustedCircle.inviteForm.fullNameLabel')}
                placeholder={t('trustedCircle.inviteForm.fullNamePlaceholder')}
                value={flow.name}
                onChange={(e) => flow.setName(e.target.value)}
                autoFocus
              />
              <Input
                label={t('trustedCircle.inviteForm.emailLabel')}
                type="email"
                autoComplete="email"
                placeholder={t('trustedCircle.inviteForm.emailPlaceholder')}
                value={flow.email}
                error={flow.emailError}
                onChange={(e) => flow.setEmail(e.target.value)}
              />
            </div>
          </>
        )
      case 2:
        return (
          <>
            <StepHeader
              step={2}
              totalSteps={flow.totalSteps}
              title={t('trustedCircle.keyPersonInvite.step2.title')}
              subtitle={t('trustedCircle.keyPersonInvite.step2.subtitle')}
              onClose={flow.onClose}
            />
            <div className="space-y-4">
              <Input
                label={t('trustedCircle.keyPersonInvite.step2.relationshipLabel')}
                placeholder={t('trustedCircle.keyPersonInvite.step2.relationshipPlaceholder')}
                value={flow.relationship}
                onChange={(e) => flow.setRelationship(e.target.value)}
                autoFocus
              />
              <Input
                label={t('trustedCircle.inviteForm.phoneLabel')}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t('trustedCircle.inviteForm.phonePlaceholder')}
                value={flow.phone}
                error={flow.phoneError}
                onChange={(e) => flow.setPhone(e.target.value)}
                onBlur={flow.handlePhoneBlur}
              />
              <div className="space-y-1.5">
                <label className="block typo-label">
                  {t('trustedCircle.inviteForm.messageLabel')}
                </label>
                <textarea
                  className="w-full resize-y rounded-lg border border-ep-border-card bg-ep-surface px-3 py-2 typo-input text-ep-body shadow-sm transition placeholder:text-ep-body-muted focus:border-ep-primary focus:outline-none focus:ring-2 focus:ring-ep-primary focus:ring-offset-1 dark:focus:border-ep-primary-accent dark:focus:ring-ep-primary-accent dark:focus:ring-offset-ep-surface"
                  rows={3}
                  placeholder={t('trustedCircle.inviteForm.messagePlaceholder')}
                  value={flow.message}
                  onChange={(e) => flow.setMessage(e.target.value)}
                />
                <p className="typo-caption text-slate-500 dark:text-slate-400">
                  {t('trustedCircle.keyPersonInvite.messageHint')}
                </p>
              </div>
            </div>
          </>
        )
      case 3:
        return (
          <>
            <StepHeader
              step={3}
              totalSteps={flow.totalSteps}
              title={t('trustedCircle.keyPersonInvite.step3.title')}
              subtitle={t('trustedCircle.keyPersonInvite.step3.subtitle')}
              onClose={flow.onClose}
            />
            <div className="space-y-3">
              <AccessTimingOption
                value="now"
                selected={flow.accessTiming === 'now'}
                title={t('trustedCircle.inviteForm.accessNow')}
                description={t('trustedCircle.keyPersonInvite.step3.accessNowDescription')}
                icon={<Eye className="h-5 w-5" />}
                onSelect={() => flow.setAccessTiming('now')}
              />
              <AccessTimingOption
                value="in_end"
                selected={flow.accessTiming === 'in_end'}
                title={t('trustedCircle.inviteForm.accessInEnd')}
                description={t('trustedCircle.keyPersonInvite.step3.accessInEndDescription')}
                icon={<Lock className="h-5 w-5" />}
                onSelect={() => flow.setAccessTiming('in_end')}
              />
            </div>
          </>
        )
      default:
        return null
    }
  })()

  const footer = (() => {
    if (flow.step === 1) {
      return (
        <div className="flex gap-3 pt-6">
          <Button type="button" variant="secondary" className="flex-1" onClick={flow.onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="primary" className="flex-1" disabled={!flow.canGoNext} onClick={flow.goNext}>
            {t('common.next')}
          </Button>
        </div>
      )
    }
    if (flow.step === 2) {
      return (
        <div className="flex gap-3 pt-6">
          <Button type="button" variant="secondary" className="flex-1" onClick={flow.goBack}>
            {t('common.back')}
          </Button>
          <Button type="button" variant="primary" className="flex-1" disabled={!flow.canGoNext} onClick={flow.goNext}>
            {t('common.next')}
          </Button>
        </div>
      )
    }
    return (
      <div className="flex gap-3 pt-6">
        <Button type="button" variant="secondary" className="flex-1" onClick={flow.goBack} disabled={flow.loading}>
          {t('common.back')}
        </Button>
        <Button
          type="button"
          variant="primary"
          className="flex-1"
          loading={flow.loading}
          disabled={!flow.canSubmit}
          onClick={() => void flow.handleSend()}
        >
          {t('trustedCircle.inviteForm.addPersonButton')}
        </Button>
      </div>
    )
  })()

  return (
    <ModalOverlay onBackdropClick={flow.onClose}>
      <Card className="scrollbar-hidden max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="p-6">
          {stepContent}
          {flow.error ? <p className="mt-4 typo-body-sm text-red-600 dark:text-red-400">{flow.error}</p> : null}
          {footer}
        </div>
      </Card>
    </ModalOverlay>
  )
}
