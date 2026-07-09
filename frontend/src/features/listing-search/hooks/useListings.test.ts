import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useListings, listingsQueryKey } from './useListings'
import { apiClient } from '../../../shared/api/client'
import type { Listing } from '../../../shared/types/listing'

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

const sampleListing: Listing = {
  id: 1,
  complexId: 1,
  salePrice: 95000,
  exclusiveArea: 84.5,
  complex: {
    id: 1,
    complexName: '테스트단지',
    address: '서울시 테스트구',
    completionYear: 2020,
    remodelingStatus: '해당없음',
    reconstructionStatus: '해당없음',
    isRegulatedArea: false,
    isLandTransactionPermissionZone: false,
    nearestShuttleStopName: '정류장1',
    nearestShuttleStopDistance: 100,
    shuttleCommuteMinutes: 30,
    latitude: 37.5,
    longitude: 127.0,
  },
}

describe('useListings', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('queryKey는 minPrice, maxPrice를 포함한 형태이다', () => {
    expect(listingsQueryKey(70000, 150000)).toEqual(['listings', { minPrice: 70000, maxPrice: 150000 }])
  })

  it('/api/listings 를 minPrice, maxPrice 쿼리 파라미터와 함께 호출하고 결과를 반환한다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleListing])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useListings(70000, 150000), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings?minPrice=70000&maxPrice=150000')
    expect(result.current.data).toEqual([sampleListing])
  })

  it('queryKey 캐시 아래에 데이터가 저장된다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleListing])

    const { Wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => useListings(70000, 150000), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(listingsQueryKey(70000, 150000))).toEqual([sampleListing])
  })

  it('서로 다른 가격 범위는 서로 다른 캐시 항목을 생성한다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleListing])
    mockedApiClient.mockResolvedValueOnce([])

    const { Wrapper, queryClient } = createWrapper()

    const { result: result1 } = renderHook(() => useListings(70000, 150000), { wrapper: Wrapper })
    await waitFor(() => expect(result1.current.isSuccess).toBe(true))

    const { result: result2 } = renderHook(() => useListings(80000, 120000), { wrapper: Wrapper })
    await waitFor(() => expect(result2.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings?minPrice=70000&maxPrice=150000')
    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings?minPrice=80000&maxPrice=120000')
    expect(mockedApiClient).toHaveBeenCalledTimes(2)

    expect(queryClient.getQueryData(listingsQueryKey(70000, 150000))).toEqual([sampleListing])
    expect(queryClient.getQueryData(listingsQueryKey(80000, 120000))).toEqual([])
  })
})
