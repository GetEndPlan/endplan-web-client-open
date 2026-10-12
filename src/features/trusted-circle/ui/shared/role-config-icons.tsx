import { Users, UserCheck, Briefcase, ShieldCheck } from 'lucide-react'
import type { ExtendedUserRole } from './role-config-constants'

export const ROLE_ICONS: Record<ExtendedUserRole, React.ReactNode> = {
  key_person: <UserCheck className="w-5 h-5" />,
  recipient: <Users className="w-5 h-5" />,
  advisor: <Briefcase className="w-5 h-5" />,
  trustee: <ShieldCheck className="w-5 h-5" />,
}
