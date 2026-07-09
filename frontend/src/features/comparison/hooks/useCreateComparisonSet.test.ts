import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useCreateComparisonSet } from './useCreateComparisonSet'
import { apiClient } from '../../../shared/api/client'
import type { ComparisonSetDetail } from '../types'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper }
}

describe('useCreateComparisonSet', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('targetType이 complex이면 complexIds를 포함한 POST 바디를 전송한다', async () => {
    const result: ComparisonSetDetail = {
      id: 1,
      userProfileId: 1,
      targetType: 'complex',
      createdAt: '2026-01-01T00:00:00.000Z',
      complexes: [],
      listings: null,
    }
    mockedApiClient.mockResolvedValueOnce(result)

    const { Wrapper } = createWrapper()
    const { result: hookResult } = renderHook(() => useCreateComparisonSet(), { wrapper: Wrapper })

    hookResult.current.mutate({ targetType: 'complex', complexIds: [1, 2] })

    await waitFor(() => expect(hookResult.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/comparison-sets', {
      method: 'POST',
      body: { targetType: 'complex', complexIds: [1, 2] },
    })
  })

  it('targetType이 listing이면 listingIds를 포함한 POST 바디를 전송한다', async () => {
    const result: ComparisonSetDetail = {
      id: 2,
      userProfileId: 1,
      targetType: 'listing',
      createdAt: '2026-01-01T00:00:00.000Z',
      complexes: null,
      listings: [],
    }
    mockedApiClient.mockResolvedValueOnce(result)

    const { Wrapper } = createWrapper()
    const { result: hookResult } = renderHook(() => useCreateComparisonSet(), { wrapper: Wrapper })

    hookResult.current.mutate({ targetType: 'listing', listingIds: [10, 20] })

    await waitFor(() => expect(hookResult.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/comparison-sets', {
      method: 'POST',
      body: { targetType: 'listing', listingIds: [10, 20] },
    })
  })
})
