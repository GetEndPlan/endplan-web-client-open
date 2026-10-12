import { Plus } from 'lucide-react'
import { Button, PageHeader } from '@/shared/ui'

type VaultSectionHeaderProps = {
  icon: string
  title: string
  subtitle: string
  addButtonLabel?: string
  onAdd?: () => void
}

export function VaultSectionHeader({
  icon,
  title,
  subtitle,
  addButtonLabel,
  onAdd,
}: VaultSectionHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="typo-symbol-display">{icon}</span>
      <div className="flex-1">
        <PageHeader
          title={title}
          description={subtitle}
          descriptionClassName="text-slate-500 dark:text-slate-400"
        />
      </div>
      {addButtonLabel && onAdd ? (
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {addButtonLabel}
        </Button>
      ) : null}
    </div>
  )
}
