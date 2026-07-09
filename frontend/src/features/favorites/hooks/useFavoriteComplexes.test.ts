import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useFavoriteComplexes, favoriteComplexesQueryKey } from './useFavoriteComplexes'
import { apiClient } from '../../../shared/api/client'
import type { FavoriteComplex } from '../types'

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

const sampleFavoriteComplex: FavoriteComplex = {
  id: 1,
  userProfileId: 1,
  complexId: 10,
  registeredAt: '2026-01-01T00:00:00.000Z',
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
  },
}

describe('useFavoriteComplexes', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('queryKey는 favorites/complexes 형태이다', () => {
    expect(favoriteComplexesQueryKey).toEqual(['favorites', 'complexes'])
  })

  it('/api/favorites/complexes 를 호출하고 결과를 반환한다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleFavoriteComplex])

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFavoriteComplexes(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/favorites/complexes')
    expect(result.current.data).toEqual([sampleFavoriteComplex])
  })

  it('queryKey 캐시 아래에 데이터가 저장된다', async () => {
    mockedApiClient.mockResolvedValueOnce([sampleFavoriteComplex])

    const { Wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => useFavoriteComplexes(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(favoriteComplexesQueryKey)).toEqual([sampleFavoriteComplex])
  })
})
