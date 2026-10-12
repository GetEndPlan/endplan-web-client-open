import { useTranslation } from 'react-i18next'
import { Card, Button, Input, PageTitle } from '@/shared/ui'

type EndPlanFormProps = {
    name: string
    description: string
    content: string
    onNameChange: (value: string) => void
    onDescriptionChange: (value: string) => void
    onContentChange: (value: string) => void
    isSaving: boolean
    error?: string | null
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
    submitLabel?: string
    title?: string
    subtitle?: string
    translationPrefix?: 'endplan.create' | 'endplan.edit'
}

export function EndPlanForm({
    name,
    description,
    content,
    onNameChange,
    onDescriptionChange,
    onContentChange,
    isSaving,
    error,
    onSubmit,
    onCancel,
    submitLabel,
    title,
    subtitle,
    translationPrefix = 'endplan.edit',
}: EndPlanFormProps) {
    const { t } = useTranslation()
    const resolvedTitle = title || t(`${translationPrefix}.title`)
    const resolvedSubtitle = subtitle || t(`${translationPrefix}.description`)
    const resolvedSubmitLabel = submitLabel || t(`${translationPrefix}.button`)

    return (
        <Card>
            <div className="p-6">
                <PageTitle as="h1" tone="gray" className="mb-2">
                  {resolvedTitle}
                </PageTitle>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{resolvedSubtitle}</p>

                <form onSubmit={onSubmit} className="space-y-6">
                    <Input
                        label={t(`${translationPrefix}.nameLabel`)}
                        placeholder={t(`${translationPrefix}.namePlaceholder`)}
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                    />

                    <Input
                        label={t(`${translationPrefix}.descriptionLabel`)}
                        placeholder={t(`${translationPrefix}.descriptionPlaceholder`)}
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                    />

                    <div>
                        <label className="mb-2 block typo-body-sm-strong text-ep-body">
                            {t(`${translationPrefix}.messageLabel`)} *
                        </label>
                        <textarea
                            className={`w-full min-h-[300px] px-4 py-3 border rounded-lg focus:border-ep-primary dark:focus:border-ep-primary-accent focus:ring-1 focus:ring-ep-primary dark:focus:ring-ep-primary-accent outline-none transition-colors resize-y bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${error && !content.trim() ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder={t(`${translationPrefix}.messagePlaceholder`)}
                            value={content}
                            onChange={(e) => onContentChange(e.target.value)}
                        />
                        <p className="mt-2 typo-body-sm text-gray-500 dark:text-gray-400">
                            {t(`${translationPrefix}.messageHelp`)}
                        </p>
                    </div>

                    {error && (
                        <p className="typo-body-sm text-red-600 dark:text-red-400">{error}</p>
                    )}

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            loading={isSaving}
                        >
                            {resolvedSubmitLabel}
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    )
}
