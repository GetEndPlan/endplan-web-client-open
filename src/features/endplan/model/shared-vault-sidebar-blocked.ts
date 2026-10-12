import {
  sharedVaultDecryptFlowEnabledWithMembership,
  type SharedVault,
} from '../api/clients/vault-api'

type MembershipLike = {
  status: string
  role: string
  accessTiming?: string
  accessGrantStatus?: string
  member?: { email?: string }
}

const SECTIONS_HIDDEN_REASONS = new Set<string>([
  'post_release_recovery',
  'awaiting_key_share',
  'deferred_grant',
])

/**
 * Aligns with SharedVaultKeyPersonSectionsBlocked reason normalization.
 */
function normalizeSectionsHiddenReason(value: string | undefined): 'deferred_grant' | 'awaiting_key_share' | 'post_release_recovery' {
  if (value && SECTIONS_HIDDEN_REASONS.has(value)) {
    return value as 'deferred_grant' | 'awaiting_key_share' | 'post_release_recovery'
  }
  return 'deferred_grant'
}

export type SharedVaultSidebarBlockedKind =
  | 'none'
  | 'pending_transfer'
  | 'deferred_grant'
  | 'awaiting_key_share'
  | 'post_release_recovery'

/**
 * Same gating as the shared vault page (`decryptFlowEnabled`); when not `none`, the overview
 * route shows SharedVaultKeyPersonSectionsBlocked or SharedVaultPendingTransferState.
 */
export function getSharedVaultSidebarBlockedKind(
  vault: SharedVault,
  memberships: MembershipLike[],
): SharedVaultSidebarBlockedKind {
  if (sharedVaultDecryptFlowEnabledWithMembership(vault, memberships)) {
    return 'none'
  }
  if (vault.role !== 'key_person') {
    return 'pending_transfer'
  }
  const reason = normalizeSectionsHiddenReason(vault.sectionsHiddenReason)
  if (reason === 'awaiting_key_share') return 'awaiting_key_share'
  if (reason === 'post_release_recovery') return 'post_release_recovery'
  return 'deferred_grant'
}
