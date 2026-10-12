import { Card } from '@/shared/ui'

export function DashboardLoadingState() {
  return (
    <Card>
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ep-primary" />
      </div>
    </Card>
  )
}
