export const trustedCircleKeys = {
  all: ['trusted-circle'] as const,
  members: () => [...trustedCircleKeys.all, 'members'] as const,
  memberships: () => [...trustedCircleKeys.all, 'memberships'] as const,
  promptState: (promptKey: string) => [...trustedCircleKeys.all, 'prompt-state', promptKey] as const,
  invitations: () => [...trustedCircleKeys.all, 'invitations'] as const,
  token: (token: string) => [...trustedCircleKeys.invitations(), 'token', token] as const,
  pendingAccess: () => [...trustedCircleKeys.all, 'pending-access'] as const,
  pendingReleaseInvitations: () => [...trustedCircleKeys.invitations(), 'pendingRelease'] as const,
  sentInvitations: () => [...trustedCircleKeys.invitations(), 'sent'] as const,
}

export const releaseKeys = {
  pendingClaims: () => ['pending-claims'] as const,
}
