import { useAuthUser } from '@/features/auth/session'
import { useLiveness } from '@/features/auth'
import { useTrustedCircle } from '@/features/trusted-circle'
import { useUserVaultSectionContent } from '../../api/hooks/queries/use-vault-queries'

const SETUP_STEPS = 4

export function useSetupProgress() {
    const { user } = useAuthUser()
    const queryEnabled = !!user
    const { hasVault, hasVaultSectionContent, isResolved: isVaultResolved } = useUserVaultSectionContent({
        enabled: queryEnabled,
    })
    const trustedCircleQuery = useTrustedCircle({ enabled: !!user })
    const livenessQuery = useLiveness({ enabled: !!user })

    const members = trustedCircleQuery.data ?? []
    const liveness = livenessQuery.data

    const hasKeyPerson = members.some((m) => m.role === 'key_person')
    const hasTransferProcessConfigured = liveness?.inactivityPeriodDays != null
    const isReady =
        !user ||
        (isVaultResolved && trustedCircleQuery.isFetched && livenessQuery.isFetched)

    const steps = [
        { done: hasVault, labelKey: 'setupStepVault' },
        // Complete when the user has real plan content: a filled asset row (not an empty
        // category placeholder), another section item, a document, or vault body text.
        { done: hasVaultSectionContent, labelKey: 'setupStepContent' },
        { done: hasKeyPerson, labelKey: 'setupStepKeyPerson' },
        { done: hasTransferProcessConfigured, labelKey: 'configureTransferProcess' },
    ]
    const completed = steps.filter((s) => s.done).length
    const percentage = Math.round((completed / SETUP_STEPS) * 100)

    return { steps, completed, percentage, isReady }
}
