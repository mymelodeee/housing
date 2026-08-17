import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useSelectLiveListing } from './useSelectLiveListing'
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

describe('useSelectLiveListing', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('POST /api/listings/live-search/select 를 캐시 id와 함께 호출하고 listingId를 반환한다', async () => {
    mockedApiClient.mockResolvedValueOnce({ listingId: 42 })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSelectLiveListing(), { wrapper: Wrapper })

    result.current.mutate(7)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/live-search/select', {
      method: 'POST',
      body: { id: 7 },
    })
    expect(result.current.data).toEqual({ listingId: 42 })
  })

  it('성공 시 listings 쿼리 캐시를 무효화한다', async () => {
    mockedApiClient.mockResolvedValueOnce({ listingId: 42 })

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useSelectLiveListing(), { wrapper: Wrapper })

    result.current.mutate(7)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listings'] })
  })
})
