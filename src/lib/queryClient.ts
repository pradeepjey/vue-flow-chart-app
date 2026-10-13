import { QueryClient, type QueryClientConfig } from '@tanstack/vue-query'

/** Query configuration mandated by the assessment brief. */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      networkMode: 'always',
      staleTime: Infinity,
      gcTime: 60 * 60 * 1000,
    },
  },
} satisfies QueryClientConfig

export function createQueryClient(): QueryClient {
  return new QueryClient(queryClientConfig)
}
