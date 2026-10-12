export const vaultKeys = {
  all: ['vaults'] as const,
  owned: () => [...vaultKeys.all, 'owned'] as const,
  shared: () => [...vaultKeys.all, 'shared'] as const,
  byId: (id: string) => [...vaultKeys.all, id] as const,
  decrypted: (id: string, updatedAt: string) => [...vaultKeys.byId(id), 'decrypted', updatedAt] as const,
  sharedDecrypted: (id: string, updatedAt: string) =>
    [...vaultKeys.byId(id), 'shared-decrypted', updatedAt] as const,
  sharedSectionsDecrypted: (id: string, ownerId: string, sectionsHash: string) =>
    [...vaultKeys.byId(id), 'shared-sections-decrypted', ownerId, sectionsHash] as const,
  sections: (vaultId: string) => [...vaultKeys.all, vaultId, 'sections'] as const,
  instructions: (vaultId: string) => [...vaultKeys.all, vaultId, 'instructions'] as const,
  contacts: (vaultId: string) => [...vaultKeys.all, vaultId, 'contacts'] as const,
  /** Owner vault: whether any section payload has items (setup / welcome signals). */
  ownerSectionsContentSignal: (vaultId: string, sectionsHash: string) =>
    [...vaultKeys.byId(vaultId), 'owner-sections-content-signal', sectionsHash] as const,
  documentsTree: (vaultId: string) => [...vaultKeys.all, vaultId, 'documents', 'tree'] as const,
  assetsSchema: (vaultId: string) => [...vaultKeys.all, vaultId, 'assets', 'schema'] as const,
  assetsAttachments: (vaultId: string) => [...vaultKeys.all, vaultId, 'assets', 'attachments'] as const,
  policiesSchema: (vaultId: string) => [...vaultKeys.all, vaultId, 'policies', 'schema'] as const,
  policiesAttachments: (vaultId: string) => [...vaultKeys.all, vaultId, 'policies', 'attachments'] as const,
  netWorth: (vaultId: string, assetsSectionVersion: string) =>
    [...vaultKeys.all, vaultId, 'net-worth', assetsSectionVersion] as const,
  netWorthRoot: (vaultId: string) => [...vaultKeys.all, vaultId, 'net-worth'] as const,
  sectionItemCounts: (vaultId: string, sectionsHash: string) =>
    [...vaultKeys.byId(vaultId), 'section-item-counts', sectionsHash] as const,
  sectionById: (vaultId: string, sectionId: string) =>
    [...vaultKeys.all, vaultId, 'sections', sectionId] as const,
  activity: (limit: number, offset: number) =>
    [...vaultKeys.all, 'activity', limit, offset] as const,
}
