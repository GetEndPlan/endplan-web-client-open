import { useState } from 'react'
import { X } from 'lucide-react'
import { Card, Button, ModalOverlay, toast } from '@/shared/ui'
import { VAULT_SECTION_TYPES } from '../shared/role-config'
import type { TrustedCircleMember } from '../../api'
import { isVisibleVaultSectionType } from '@/features/endplan/model'

type MemberSectionsModalProps = {
    member: TrustedCircleMember
    onClose: () => void
    onSave: (id: string, allowedSectionTypes: string[]) => Promise<void>
    t: (key: string) => string
    /** Plan limit: section types the owner can grant */
    sectionsGranted?: string[]
    /** Plan limit: max sections grantable per member */
    sectionItemsGrantedMax?: number
}

export function MemberSectionsModal({ member, onClose, onSave, t, sectionsGranted, sectionItemsGrantedMax }: MemberSectionsModalProps) {
    const selectableSectionTypes = (
        sectionsGranted?.length ? sectionsGranted : Array.from(VAULT_SECTION_TYPES)
    ).filter(isVisibleVaultSectionType)
    const maxSections = sectionItemsGrantedMax ?? selectableSectionTypes.length

    const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
        const current = member.allowedSectionTypes?.slice() ?? []
        return current.filter((s) => selectableSectionTypes.includes(s)).slice(0, maxSections)
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const toggleType = (sectionType: string) => {
        setSelectedTypes((prev) => {
            if (prev.includes(sectionType)) return prev.filter((s) => s !== sectionType)
            if (prev.length >= maxSections) return prev
            return [...prev, sectionType]
        })
    }

    const handleSave = async () => {
        setError(null)
        setSaving(true)
        try {
            await onSave(member.id, selectedTypes)
            toast.success(t('trustedCircle.sectionsModal.saved'))
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <ModalOverlay>
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="typo-heading-card text-slate-900 dark:text-slate-100">
                                {t('trustedCircle.sectionsModal.title')}
                            </h2>
                            <p className="typo-body-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {member.member?.name || member.member?.email || 'Member'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="typo-body-sm text-slate-600 dark:text-slate-400 mb-4">
                        {t('trustedCircle.sectionsModal.hint')}
                        {sectionItemsGrantedMax != null && (
                            <span className="block mt-1 text-slate-500 dark:text-slate-400">
                                {selectedTypes.length} of {maxSections} sections selected.
                            </span>
                        )}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {selectableSectionTypes.map((sectionType) => {
                            const checked = selectedTypes.includes(sectionType)
                            const atMax = !checked && selectedTypes.length >= maxSections
                            return (
                                <label
                                    key={sectionType}
                                    className={`flex items-center gap-2 ${atMax ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={atMax}
                                        onChange={() => toggleType(sectionType)}
                                        className="rounded border-slate-300 text-ep-primary focus:ring-ep-primary"
                                    />
                                    <span className="typo-body-sm text-slate-700 dark:text-slate-300">
                                        {t(`nav.${sectionType}`)}
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                    {error && <p className="typo-body-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            loading={saving}
                            onClick={handleSave}
                        >
                            {t('trustedCircle.sectionsModal.save')}
                        </Button>
                    </div>
                </div>
            </Card>
        </ModalOverlay>
    )
}
