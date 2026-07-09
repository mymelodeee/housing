import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useRemoveFavoriteListing } from './useRemoveFavoriteListing'
import { favoriteListingsQueryKey } from './useFavoriteListings'
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

describe('useRemoveFavoriteListing', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('DELETE /api/favorites/listings/{listingId} 를 호출하고 성공 시 캐시를 무효화한다', async () => {
    mockedApiClient.mockResolvedValueOnce(undefined)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRemoveFavoriteListing(), { wrapper: Wrapper })

    result.current.mutate(42)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/favorites/listings/42', { method: 'DELETE' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: favoriteListingsQueryKey })
  })
})
