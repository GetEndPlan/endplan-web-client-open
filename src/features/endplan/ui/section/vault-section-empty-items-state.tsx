import { Plus, Wallet } from 'lucide-react'
import { Card, Button } from '@/shared/ui'

type VaultSectionEmptyItemsStateProps = {
  addFirstTitle: string
  addFirstDescription: string
  addButtonLabel?: string
  onAdd?: () => void
}

export function VaultSectionEmptyItemsState({
  addFirstTitle,
  addFirstDescription,
  addButtonLabel,
  onAdd,
}: VaultSectionEmptyItemsStateProps) {
  return (
    <Card>
      <div className="py-12 px-4 text-center">
        <div className="mx-auto w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
          <Wallet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="typo-heading-card text-slate-900 dark:text-slate-100 mb-2">
          {addFirstTitle}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          {addFirstDescription}
        </p>
        {addButtonLabel && onAdd ? (
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            {addButtonLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
