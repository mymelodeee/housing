import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useListingPriceHistory, listingPriceHistoryQueryKey } from './useListingPriceHistory'
import { apiClient } from '../../../../shared/api/client'
import type { PriceHistoryResponse } from '../types'

vi.mock('../../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper, queryClient }
}

describe('useListingPriceHistory', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('/api/listings/{id}/price-history 를 호출하고 결과를 반환한다', async () => {
    const response: PriceHistoryResponse = {
      listingId: 1,
      complexId: 10,
      lookupPeriodType: '최근 20년',
      firstTransactionMonth: null,
      entries: [
        { transactionDate: '2020-01', transactionPrice: 80000, dataSource: '국토교통부' },
      ],
    }
    mockedApiClient.mockResolvedValueOnce(response)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useListingPriceHistory('1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/1/price-history')
    expect(result.current.data).toEqual(response)
  })

  it('queryKey는 listingId를 포함한 listing-price-history 이다', () => {
    expect(listingPriceHistoryQueryKey('42')).toEqual(['listing-price-history', '42'])
  })

  it('queryKey 캐시 아래에 데이터가 저장된다', async () => {
    const response: PriceHistoryResponse = {
      listingId: 2,
      complexId: 20,
      lookupPeriodType: '실거래 이력 없음',
      firstTransactionMonth: null,
      entries: [],
    }
    mockedApiClient.mockResolvedValueOnce(response)

    const { Wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => useListingPriceHistory('2'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(listingPriceHistoryQueryKey('2'))).toEqual(response)
  })
})
