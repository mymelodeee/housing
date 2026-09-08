import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useAddFavoriteComplex } from './useAddFavoriteComplex'
import { favoriteComplexesQueryKey } from './useFavoriteComplexes'
import { apiClient, ApiError } from '../../../shared/api/client'
import type { FavoriteComplex } from '../types'

vi.mock('../../../shared/api/client', async () => {
  const actual = await vi.importActual<typeof import('../../../shared/api/client')>(
    '../../../shared/api/client',
  )
  return {
    ...actual,
    apiClient: vi.fn(),
  }
})

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper, queryClient }
}

describe('useAddFavoriteComplex', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('POST /api/favorites/complexes 로 complexId를 전송하고 성공 시 캐시를 무효화한다', async () => {
    const data: FavoriteComplex = {
      id: 1,
      userProfileId: 1,
      complexId: 3,
      registeredAt: '2026-01-01T00:00:00.000Z',
      complex: {
        id: 3,
        complexName: '단지3',
        address: '서울시 테스트구',
        completionYear: 2020,
        remodelingStatus: '해당없음',
        reconstructionStatus: '해당없음',
        isRegulatedArea: false,
        isLandTransactionPermissionZone: false,
        nearestShuttleStopName: null,
        nearestShuttleStopDistance: null,
        shuttleCommuteMinutes: null,
        householdCount: null,
        buildingCount: null,
      },
    }
    mockedApiClient.mockResolvedValueOnce(data)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useAddFavoriteComplex(), { wrapper: Wrapper })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/favorites/complexes', {
      method: 'POST',
      body: { complexId: 3 },
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: favoriteComplexesQueryKey })
  })

  it('409 응답 시 ApiError가 그대로 전파된다', async () => {
    mockedApiClient.mockRejectedValueOnce(new ApiError(409, '이미 즐겨찾기에 등록되어 있습니다'))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAddFavoriteComplex(), { wrapper: Wrapper })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(ApiError)
  })
})
