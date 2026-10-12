export type SectionType = 'assets' | 'documents' | 'instructions' | 'contacts' | 'policies' | 'recovery'

/** Section type string constants – use these instead of literals when comparing or building paths */
export const SECTION_ID = {
  ASSETS: 'assets',
  DOCUMENTS: 'documents',
  INSTRUCTIONS: 'instructions',
  CONTACTS: 'contacts',
  POLICIES: 'policies',
  /** Owner-only encrypted backup; never show in nav or trusted-circle grants */
  RECOVERY: 'recovery',
} as const satisfies Record<string, SectionType>

/** Reserved section types that must not appear in product UI yet. */
const HIDDEN_VAULT_SECTION_TYPES = new Set(['video', 'videos', SECTION_ID.RECOVERY])

export function isVisibleVaultSectionType(sectionType: string | undefined): boolean {
  if (!sectionType) return false
  return !HIDDEN_VAULT_SECTION_TYPES.has(sectionType.trim().toLowerCase())
}

export const ASSET_TYPES = [
  { value: 'bank_account', label: 'Bank account' },
  { value: 'investment_portfolio', label: 'Investment portfolio' },
  { value: 'insurance_policy', label: 'Insurance policy' },
  { value: 'property_deed', label: 'Property deed' },
  { value: 'other', label: 'Other' },
] as const

export const DOCUMENT_TYPES = [
  { value: 'id_passport', label: 'ID / passport' },
  { value: 'birth_certificate', label: 'Birth certificate' },
  { value: 'marriage_certificate', label: 'Marriage certificate' },
  { value: 'academic_record', label: 'Academic record' },
  { value: 'property_deed', label: 'Property deed' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'other', label: 'Other' },
] as const

export type AssetItem = {
  id: string
  assetType: string
  assetName: string
  institution: string
  accountOrPolicyNumber: string
  notes: string
}
export type DocumentItem = {
  id: string
  documentType: string
  documentName: string
  location: string
  referenceNumber: string
  issueDate: string
  notes: string
}

export type SectionItem = AssetItem | DocumentItem

export type SectionContent = { items: SectionItem[] }

export const SECTION_CONFIG: Record<SectionType, { icon: string; placeholder: string }> = {
  [SECTION_ID.ASSETS]: {
    icon: '💰',
    placeholder: 'Record your financial assets, bank accounts, investments, property, and valuables...',
  },
  [SECTION_ID.DOCUMENTS]: {
    icon: '📄',
    placeholder: 'Store important documents and identification information...',
  },
  [SECTION_ID.INSTRUCTIONS]: {
    icon: '📝',
    placeholder: 'Leave practical guidance and step-by-step instructions for your key person...',
  },
  [SECTION_ID.CONTACTS]: {
    icon: '👤',
    placeholder: 'Add the people who matter to your plan and the role they play...',
  },
  [SECTION_ID.POLICIES]: {
    icon: '🛡️',
    placeholder: 'Record legal, household, and other policies for your trusted circle...',
  },
  [SECTION_ID.RECOVERY]: {
    icon: '🔐',
    placeholder: '',
  },
}
