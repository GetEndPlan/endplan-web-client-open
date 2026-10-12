import { TransferProcessSafetyWindow } from '@/features/auth'
import { useAuthUser } from '@/features/auth/session'
import { useSubscription } from '@/features/billing'
import { useKeyPersonPageGate } from '@/features/trusted-circle/hooks/use-key-person-page-gate'
import { KeyPersonStartOwnEndplanGateModal } from '@/features/trusted-circle/ui/key-person/key-person-start-own-endplan-gate-modal'

export function ConfigureTransferProcessPage() {
  const { user } = useAuthUser()
  const { data: subscription } = useSubscription({ enabled: !!user })
  const gate = useKeyPersonPageGate()
  const readOnly = subscription?.canAccess === false

  return (
    <div className="space-y-4 pb-6 pt-4 sm:pt-6 lg:pt-0">
      {gate.requiresGate ? (
        <KeyPersonStartOwnEndplanGateModal
          isOpen={gate.showGateModal}
          onStartOwnEndplan={gate.onStartOwnEndplan}
          onContinueFree={gate.onContinueFree}
        />
      ) : null}

      <TransferProcessSafetyWindow
        readOnly={readOnly}
        interactionLocked={gate.requiresGate && gate.ctasSuppressed}
        onInteractionBlocked={gate.openGateModal}
      />
    </div>
  )
}
