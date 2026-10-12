import { QueryClient } from '@tanstack/react-query'
import { ApiError, ApiRequestsBlockedError } from '@/shared/api/client'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: (failureCount, error) => {
                if (error instanceof ApiRequestsBlockedError) {
                    return false
                }
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                    return false
                }
                return failureCount < 1
            },
            refetchOnWindowFocus: false,
        },
    },
})
