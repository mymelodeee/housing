import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useLiveListings, liveListingsQueryKey } from './useLiveListings'
import { apiClient } from '../../../shared/api/client'
import type { RegionalListing } from '../types'

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

const sampleEntry: RegionalListing = {
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

describe('useLiveListings', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('queryKey는 minPrice, maxPrice를 포함한 형태이다', () => {
    expect(liveListingsQueryKey(70000, 150000)).toEqual(['live-listings', { minPrice: 70000, maxPrice: 150000 }])
  })

  it('enabled가 true이면 /api/listings/live-search 를 가격 파라미터와 함께 호출한다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleEntry])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLiveListings(70000, 150000, true), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/live-search?minPrice=70000&maxPrice=150000')
    expect(result.current.data).toEqual([sampleEntry])
  })

  it('enabled가 false이면 API를 호출하지 않는다', () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useLiveListings(70000, 150000, false), { wrapper: Wrapper })

    expect(mockedApiClient).not.toHaveBeenCalled()
  })
})
