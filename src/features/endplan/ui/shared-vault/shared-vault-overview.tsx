import { Card } from '@/shared/ui'
import type { EndPlanData } from '@/features/endplan/api/services/endplan-service'

type SharedVaultOverviewProps = {
    data: EndPlanData
}

export function SharedVaultOverview({ data }: SharedVaultOverviewProps) {
    if (!data.title && !data.content) return null

    return (
        <Card className="mt-6">
            <Card.Header
                title={data.title || 'EndPlan overview'}
                subtitle="Encrypted content decrypted for viewing"
            />
            <Card.Body>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    {data.content ? (
                        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                            {data.content}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No overview content.</p>
                    )}
                </div>
            </Card.Body>
        </Card>
    )
}
