import i18n from './i18n'

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}
