import {
  usePendingReleaseInvitations,
  useReleaseAllInvitations,
} from '@/features/trusted-circle'

export function useEditEndPlanRelease() {
  const { data: pendingReleaseInvitations = [], refetch: refetchPending } = usePendingReleaseInvitations()
  const releaseAllMutation = useReleaseAllInvitations()

  const isReleasing = releaseAllMutation.isPending

  const handleReleaseAll = async () => {
    const response = await releaseAllMutation.mutateAsync()
    return response.released
  }

  return {
    pendingReleaseInvitations,
    isReleasing,
    refetchPending,
    handleReleaseAll,
  }
}
