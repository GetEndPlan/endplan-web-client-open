import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/constants/routes'
import { AlertTriangle } from 'lucide-react'
import { Card, Button } from '@/shared/ui'

export function EncryptionKeysRequired() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <div className="p-6 text-center">
                        <div className="mx-auto h-12 w-12 text-red-100 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900/30">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="mt-4 typo-heading-subcard text-gray-900 dark:text-gray-100">Encryption Keys Required</h2>
                        <p className="mt-2 typo-body-sm text-gray-500 dark:text-gray-400">
                            Your encryption keys are not available. Please log out and log in again to reload them.
                        </p>
                        <Button className="mt-6" onClick={() => navigate(ROUTES.DASHBOARD)}>
                            Back to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
