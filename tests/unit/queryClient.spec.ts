import { describe, expect, it } from 'vitest'
import { createQueryClient, queryClientConfig } from '@/lib/queryClient'

describe('query client config', () => {
  it('matches the required configuration', () => {
    expect(queryClientConfig.defaultOptions.queries).toEqual({
      refetchOnWindowFocus: false,
      networkMode: 'always',
      staleTime: Infinity,
      gcTime: 3600000,
    })
    expect(createQueryClient().getDefaultOptions().queries?.staleTime).toBe(Infinity)
  })
})
