import { contactRoleDisplayLabel, type ContactItem, type ContactRole } from '../../model/contacts'
import { toCsvDocument } from './csv'

export type ContactsCsvHeaders = {
  fullName: string
  role: string
  phone: string
  email: string
  notes: string
}

export function buildContactsCsv(args: {
  items: ContactItem[]
  headers: ContactsCsvHeaders
  roleLabels: Record<ContactRole, string>
}): string {
  const rows = args.items.map((item) => [
    item.fullName,
    contactRoleDisplayLabel(item, args.roleLabels),
    item.phone,
    item.email,
    item.notes,
  ])

  return toCsvDocument(
    [args.headers.fullName, args.headers.role, args.headers.phone, args.headers.email, args.headers.notes],
    rows,
  )
}
