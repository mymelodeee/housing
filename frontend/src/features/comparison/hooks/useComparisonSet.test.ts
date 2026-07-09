import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useComparisonSet, comparisonSetQueryKey } from './useComparisonSet'
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

describe('useComparisonSet', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('comparisonSetQueryKey는 id를 포함한 쿼리키를 생성한다', () => {
    expect(comparisonSetQueryKey('7')).toEqual(['comparison-sets', '7'])
  })

  it('GET /api/comparison-sets/{id} 를 호출하고 데이터를 반환한다', async () => {
    const data: ComparisonSetDetail = {
      id: 7,
      userProfileId: 1,
      targetType: 'complex',
      createdAt: '2026-01-01T00:00:00.000Z',
      complexes: [],
      listings: null,
    }
    mockedApiClient.mockResolvedValueOnce(data)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useComparisonSet('7'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/comparison-sets/7')
    expect(result.current.data).toEqual(data)
  })
})
