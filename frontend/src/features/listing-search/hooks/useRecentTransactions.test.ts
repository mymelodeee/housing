import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useRecentTransactions, recentTransactionsQueryKey } from './useRecentTransactions'
import { apiClient } from '../../../shared/api/client'
import type { RegionalTransaction } from '../types'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper, queryClient }
}

const sampleEntry: RegionalTransaction = {
  id: 1,
  lawdCd: '11740',
  kaptCode: null,
  complexName: '실시간단지',
  address: '서울 강동구 상일동 1',
  exclusiveArea: 84.5,
  salePrice: 100000,
  transactionDate: '2026-07-15',
  householdCount: 1000,
  latitude: 37.5,
  longitude: 127.1,
  collectedAt: '2026-08-17T00:00:00Z',
}

describe('useRecentTransactions', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('queryKey는 minPrice, maxPrice, city를 포함한 형태이다', () => {
    expect(recentTransactionsQueryKey(70000, 150000)).toEqual([
      'recent-transactions',
      { minPrice: 70000, maxPrice: 150000, city: '' },
    ])
  })

  it('enabled가 true이면 /api/listings/market-search 를 가격 파라미터와 함께 호출한다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleEntry])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRecentTransactions(70000, 150000, true), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/market-search?minPrice=70000&maxPrice=150000')
    expect(result.current.data).toEqual([sampleEntry])
  })

  it('enabled가 false이면 API를 호출하지 않는다', () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useRecentTransactions(70000, 150000, false), { wrapper: Wrapper })

    expect(mockedApiClient).not.toHaveBeenCalled()
  })

  it('city가 지정되면 city 쿼리 파라미터가 추가된다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleEntry])
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useRecentTransactions(70000, 150000, true, '용인시'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith(
      `/api/listings/market-search?minPrice=70000&maxPrice=150000&city=${encodeURIComponent('용인시')}`,
    )
  })
})
