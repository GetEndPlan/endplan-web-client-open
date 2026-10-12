import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CONTACT_ROLES, type ContactRole } from '../../model/contacts'

/** Translated, human-readable labels for each contact role. */
export function useContactRoleLabels(): Record<ContactRole, string> {
  const { t } = useTranslation()
  return useMemo(() => {
    const labels = {} as Record<ContactRole, string>
    for (const role of CONTACT_ROLES) {
      labels[role] = t(`vault.contacts.roles.${role}`)
    }
    return labels
  }, [t])
}
