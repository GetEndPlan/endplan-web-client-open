import { ChevronRight } from 'lucide-react'
import type { DecryptedVaultDocumentFolder } from '../../hooks/documents/use-vault-documents-page'

const crumbTextClass =
  'typo-emphasis-bold text-left text-[22px] leading-tight text-gray-900 dark:text-gray-100'

const crumbButtonClass = `${crumbTextClass} rounded-[7px] px-2 py-1 transition hover:bg-gray-100 dark:hover:bg-ep-primary-dark/50`

type DocumentsDriveBreadcrumbsProps = {
  rootLabel: string
  breadcrumbs: DecryptedVaultDocumentFolder[]
  selectedFolderId: string | null
  onNavigate: (folderId: string | null) => void
}

export function DocumentsDriveBreadcrumbs({
  rootLabel,
  breadcrumbs,
  selectedFolderId,
  onNavigate,
}: DocumentsDriveBreadcrumbsProps) {
  if (!selectedFolderId) {
    return (
      <nav aria-label={rootLabel} className="breadcrumb-wrapper min-w-0 flex-1">
        <ol className="flex flex-wrap items-center">
          <li className="flex items-center">
            <span className={`${crumbTextClass} px-2 py-1`} aria-current="page">
              {rootLabel}
            </span>
          </li>
        </ol>
      </nav>
    )
  }

  return (
    <nav aria-label={rootLabel} className="breadcrumb-wrapper min-w-0 flex-1">
      <ol className="flex flex-wrap items-center">
        <li className="flex items-center">
          <button type="button" onClick={() => onNavigate(null)} className={crumbButtonClass}>
            {rootLabel}
          </button>
          <span className="mx-1 flex items-center text-gray-400 dark:text-slate-500" aria-hidden>
            <ChevronRight size={16} className="breadcrumb-separator shrink-0" />
          </span>
        </li>
        {breadcrumbs.map((folder, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <li key={folder.id} className="flex items-center">
              {isLast ? (
                <span className={`${crumbTextClass} px-2 py-1`} aria-current="page">
                  {folder.name}
                </span>
              ) : (
                <>
                  <button type="button" onClick={() => onNavigate(folder.id)} className={crumbButtonClass}>
                    {folder.name}
                  </button>
                  <span className="mx-1 flex items-center text-gray-400 dark:text-slate-500" aria-hidden>
                    <ChevronRight size={16} className="shrink-0" />
                  </span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
