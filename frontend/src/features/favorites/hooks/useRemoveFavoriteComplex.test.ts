import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useRemoveFavoriteComplex } from './useRemoveFavoriteComplex'
import { favoriteComplexesQueryKey } from './useFavoriteComplexes'
import { apiClient } from '../../../shared/api/client'

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

describe('useRemoveFavoriteComplex', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('DELETE /api/favorites/complexes/{complexId} 를 호출하고 성공 시 캐시를 무효화한다', async () => {
    mockedApiClient.mockResolvedValueOnce(undefined)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRemoveFavoriteComplex(), { wrapper: Wrapper })

    result.current.mutate(42)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/favorites/complexes/42', { method: 'DELETE' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: favoriteComplexesQueryKey })
  })
})
