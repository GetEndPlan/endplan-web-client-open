import { ArrowLeft } from 'lucide-react'

type VaultSectionBackButtonProps = {
  label: string
  onClick: () => void
}

export function VaultSectionBackButton({ label, onClick }: VaultSectionBackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 typo-body-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}
