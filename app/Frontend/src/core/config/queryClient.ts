import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

/**
 * TanStack Query Configuration
 * Optimized for financial applications with conservative caching
 */
const queryConfig: DefaultOptions = {
    queries: {
        // Data is considered fresh for 30 seconds
        staleTime: 1000 * 30,

        // Cache data for 5 minutes
        gcTime: 1000 * 60 * 5,

        // Retry failed requests 2 times (important for financial data)
        retry: 2,

        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Don't refetch on window focus by default (can be overridden per query)
        refetchOnWindowFocus: false,

        // Refetch on reconnect (important for real-time financial data)
        refetchOnReconnect: true,

        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
    },
    mutations: {
        // Retry mutations once on failure
        retry: 1,
    },
};

/**
 * Global QueryClient Instance
 * Use this instance throughout the application
 */
export const queryClient = new QueryClient({
    defaultOptions: queryConfig,
});
