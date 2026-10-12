import { X, Lightbulb } from 'lucide-react'
import { Card, Button, Input, ModalOverlay } from '@/shared/ui'
import { ROLE_ICONS, ROLE_COLORS, ROLE_DESCRIPTIONS } from '../shared/role-config'
import type { ExtendedUserRole } from '../shared/role-config'
import type { CreateInvitationRequest, Invitation } from '../../api'
import { useInviteMemberForm } from '../../hooks/use-invite-member-form'
import { KeyPersonInviteModal } from './key-person-invite-modal'

type InviteMemberModalProps = {
    role: ExtendedUserRole
    onClose: () => void
    onSend: (data: CreateInvitationRequest) => Promise<Invitation>
    t: (key: string) => string
    sectionsGranted?: string[]
    sectionItemsGrantedMax?: number
}

function isKeyPersonRole(role: ExtendedUserRole): boolean {
    return role === 'key_person' || role === 'trustee'
}

function LegacyInviteMemberModal({
    role,
    onClose,
    onSend,
    t,
    sectionsGranted,
    sectionItemsGrantedMax,
}: InviteMemberModalProps) {
    const form = useInviteMemberForm({ role, onSend, onClose, t, sectionsGranted, sectionItemsGrantedMax })

    return (
        <ModalOverlay>
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${ROLE_COLORS[role]}`}>
                                {ROLE_ICONS[role]}
                            </div>
                            <div>
                                <h2 className="typo-heading-card text-slate-900 dark:text-slate-100">
                                    {t('trustedCircle.inviteForm.addPersonButton')}
                                </h2>
                                <p className="typo-caption text-slate-500 dark:text-slate-400">
                                    {ROLE_DESCRIPTIONS[role]}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-5 rounded-lg border border-ep-border-subtle bg-ep-surface p-3">
                        <p className="typo-caption-strong text-slate-700 dark:text-slate-300 mb-1">
                            {t('trustedCircle.members.title')}
                        </p>
                        <p className="typo-caption text-slate-600 dark:text-slate-400">
                            {t('trustedCircle.inviteForm.circleInfo')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Input label={t('trustedCircle.inviteForm.fullNameLabel')} placeholder={t('trustedCircle.inviteForm.fullNamePlaceholder')} value={form.name} onChange={(e) => form.setName(e.target.value)} />
                        <Input
                          label={t('trustedCircle.inviteForm.emailLabel')}
                          type="email"
                          autoComplete="email"
                          placeholder={t('trustedCircle.inviteForm.emailPlaceholder')}
                          value={form.email}
                          error={form.emailError}
                          onChange={(e) => form.setEmail(e.target.value)}
                        />
                        <Input label={t('trustedCircle.inviteForm.relationshipLabel')} placeholder={t('trustedCircle.inviteForm.relationshipPlaceholder')} value={form.relationship} onChange={(e) => form.setRelationship(e.target.value)} />
                        <Input
                          label={t('trustedCircle.inviteForm.phoneLabel')}
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder={t('trustedCircle.inviteForm.phonePlaceholder')}
                          value={form.phone}
                          error={form.phoneError}
                          onChange={(e) => form.setPhone(e.target.value)}
                        />

                        {form.showAccessTimingSelector && (
                            <div>
                                <label className="mb-2 block typo-body-sm-strong text-ep-body">
                                    {t('trustedCircle.inviteForm.accessTimingLabel')}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => form.setAccessTiming('now')}
                                        className={`rounded-lg border px-3 py-2 typo-body-sm text-left transition-colors ${
                                            form.accessTiming === 'now'
                                                ? 'border-ep-primary bg-ep-primary-softer text-ep-primary-accent dark:border-ep-primary-accent dark:bg-ep-primary-dark/30 dark:text-ep-primary-soft'
                                                : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-ep-surface-panel'
                                        }`}
                                    >
                                        {t('trustedCircle.inviteForm.accessNow')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => form.setAccessTiming('in_end')}
                                        className={`rounded-lg border px-3 py-2 typo-body-sm text-left transition-colors ${
                                            form.accessTiming === 'in_end'
                                                ? 'border-ep-primary bg-ep-primary-softer text-ep-primary-accent dark:border-ep-primary-accent dark:bg-ep-primary-dark/30 dark:text-ep-primary-soft'
                                                : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-ep-surface-panel'
                                        }`}
                                    >
                                        {t('trustedCircle.inviteForm.accessInEnd')}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3">
                            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="typo-caption text-amber-800 dark:text-amber-200">
                                {t('trustedCircle.inviteForm.addPersonHint')}
                            </p>
                        </div>

                        {form.showSectionSelector && (
                            <div>
                                <label className="mb-2 block typo-body-sm-strong text-ep-body">
                                    {t('trustedCircle.inviteForm.sectionsLabel')}
                                    {sectionItemsGrantedMax != null && (
                                        <span className="ml-2 text-slate-500 dark:text-slate-400 typo-regular">
                                            ({form.allowedSectionTypes.length} of {form.maxSections})
                                        </span>
                                    )}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {form.selectableSectionTypes.map((sectionType) => {
                                        const checked = form.allowedSectionTypes.includes(sectionType)
                                        const atMax = !checked && form.allowedSectionTypes.length >= form.maxSections
                                        return (
                                            <label
                                                key={sectionType}
                                                className={`flex items-center gap-2 ${atMax ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={atMax}
                                                    onChange={() => form.toggleSectionType(sectionType)}
                                                    className="rounded border-slate-300 text-ep-primary focus:ring-ep-primary"
                                                />
                                                <span className="typo-body-sm text-slate-700 dark:text-slate-300">{t(`nav.${sectionType}`)}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block typo-body-sm-strong text-ep-body">
                                {t('trustedCircle.inviteForm.messageLabel')}
                            </label>
                            <textarea
                                className="w-full resize-y rounded-lg border border-ep-border-card bg-ep-surface px-4 py-3 text-ep-body outline-none transition-colors placeholder:text-ep-body-muted focus:border-ep-primary focus:ring-1 focus:ring-ep-primary dark:focus:border-ep-primary-accent dark:focus:ring-ep-primary-accent"
                                rows={3}
                                placeholder={t('trustedCircle.inviteForm.messagePlaceholder')}
                                value={form.message}
                                onChange={(e) => form.setMessage(e.target.value)}
                            />
                        </div>

                        {form.error && <p className="typo-body-sm text-red-600 dark:text-red-400">{form.error}</p>}

                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" className="flex-1" onClick={onClose}>{t('common.cancel')}</Button>
                            <Button className="flex-1" loading={form.loading} onClick={form.handleSend}>{t('trustedCircle.inviteForm.addPersonButton')}</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </ModalOverlay>
    )
}

export function InviteMemberModal(props: InviteMemberModalProps) {
    if (isKeyPersonRole(props.role)) {
        return <KeyPersonInviteModal onClose={props.onClose} onSend={props.onSend} />
    }
    return <LegacyInviteMemberModal {...props} />
}
