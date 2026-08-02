import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useComparisonSets, comparisonSetsQueryKey } from './useComparisonSets'
import { apiClient } from '../../../shared/api/client'
import type { ComparisonSetSummary } from '../types'

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

describe('useComparisonSets', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('comparisonSetsQueryKey는 목록 쿼리키를 생성한다', () => {
    expect(comparisonSetsQueryKey).toEqual(['comparison-sets'])
  })

  it('GET /api/comparison-sets 를 호출하고 목록 데이터를 반환한다', async () => {
    const data: ComparisonSetSummary[] = [
      {
        id: 1,
        targetType: 'complex',
        createdAt: '2026-01-01T00:00:00.000Z',
        itemCount: 3,
        itemNames: ['동탄역 시범 우남퍼스트빌', '평택 소사벌 한라비발디', '위례신도시 롯데캐슬'],
      },
    ]
    mockedApiClient.mockResolvedValueOnce(data)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useComparisonSets(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/comparison-sets')
    expect(result.current.data).toEqual(data)
  })
})
