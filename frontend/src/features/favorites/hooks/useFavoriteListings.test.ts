import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useFavoriteListings, favoriteListingsQueryKey } from './useFavoriteListings'
import { apiClient } from '../../../shared/api/client'
import type { FavoriteListing } from '../types'

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

const sampleFavoriteListing: FavoriteListing = {
  id: 1,
  userProfileId: 1,
  listingId: 20,
  registeredAt: '2026-01-01T00:00:00.000Z',
  listing: {
    id: 20,
    complexId: 10,
    salePrice: 95000,
    exclusiveArea: 84.5,
    complex: {
      id: 10,
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
  },
}

describe('useFavoriteListings', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('queryKey는 favorites/listings 형태이다', () => {
    expect(favoriteListingsQueryKey).toEqual(['favorites', 'listings'])
  })

  it('/api/favorites/listings 를 호출하고 결과를 반환한다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleFavoriteListing])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFavoriteListings(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/favorites/listings')
    expect(result.current.data).toEqual([sampleFavoriteListing])
  })

  it('queryKey 캐시 아래에 데이터가 저장된다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleFavoriteListing])

    const { Wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => useFavoriteListings(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(favoriteListingsQueryKey)).toEqual([sampleFavoriteListing])
  })
})
