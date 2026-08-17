import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useListingJeonseHistory, listingJeonseHistoryQueryKey } from './useListingJeonseHistory'
import { apiClient } from '../../../../shared/api/client'
import type { JeonseHistoryResponse } from '../types'

vi.mock('../../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper }
}

const sampleResponse: JeonseHistoryResponse = {
  listingId: 12,
  complexId: 8,
  saleEntries: [{ transactionDate: '2026-06-10', transactionPrice: 100000, dataSource: 's' }],
  jeonseEntries: [{ transactionDate: '2026-06-15', deposit: 60000, dataSource: 'j' }],
  ratioEntries: [{ month: '2026-06', jeonseRatioPercent: 60 }],
  lookupWindowNote: 'note',
}

describe('useListingJeonseHistory', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('queryKey는 listingId를 포함한다', () => {
    expect(listingJeonseHistoryQueryKey('12')).toEqual(['listing-jeonse-history', '12'])
  })

  it('/api/listings/{id}/jeonse-history 를 호출하고 결과를 반환한다', async () => {
    mockedApiClient.mockResolvedValueOnce(sampleResponse)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useListingJeonseHistory('12'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/12/jeonse-history')
    expect(result.current.data).toEqual(sampleResponse)
  })
})
