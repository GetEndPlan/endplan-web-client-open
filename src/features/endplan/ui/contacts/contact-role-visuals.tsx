import { cn } from '@/shared/lib/cn'
import { EndPlanIcon, type EndPlanIconName } from '@/shared/ui'
import { contactRoleDisplayLabel, type ContactItem, type ContactRole } from '../../model/contacts'

type ContactRoleIconProps = {
  role: ContactRole
  className?: string
}

function contactRoleIconName(role: ContactRole): EndPlanIconName {
  switch (role) {
    case 'lawyer':
      return 'lawyer'
    case 'doctor':
      return 'doctor'
    case 'financial_manager':
      return 'bank'
    case 'power_of_attorney':
      return 'power-of-attorney'
    default:
      return 'contact'
  }
}

/** Icon representing a contact role. */
export function ContactRoleIcon({ role, className }: ContactRoleIconProps) {
  return <EndPlanIcon name={contactRoleIconName(role)} size={24} className={cn('size-4', className)} />
}

type ContactRoleBadgeProps = {
  contact: Pick<ContactItem, 'role' | 'customRoleLabel'>
  roleLabels: Record<ContactRole, string>
  className?: string
}

/** Pill showing a role's icon and label. */
export function ContactRoleBadge({ contact, roleLabels, className }: ContactRoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-ep-primary-softer px-2.5 py-0.5 typo-caption-strong text-ep-primary dark:bg-ep-primary/15',
        className,
      )}
    >
      <ContactRoleIcon role={contact.role} className="size-3.5" />
      {contactRoleDisplayLabel(contact, roleLabels)}
    </span>
  )
}
