export type NavLinkLeaf = {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
  /** Secondary line (e.g. shared vault sealed / pending status). */
  navHint?: string
  /** Stable selector target for onboarding tours (rendered as data-tour). */
  dataTour?: string
}

export type NavItem = NavLinkLeaf & {
  /** When set (non-empty), sidebar shows expandable subsection links under this item. */
  children?: NavLinkLeaf[]
}

export type NavSection = {
  title?: string
  items: NavItem[]
}
