import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useRegionCities } from './useRegionCities'
import { apiClient } from '../../../shared/api/client'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper }
}

describe('useRegionCities', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('/api/listings/regions/cities 를 호출하고 결과를 반환한다', async () => {
    mockedApiClient.mockResolvedValueOnce({ cities: ['화성시', '수원시'] })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRegionCities(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/regions/cities')
    expect(result.current.data).toEqual({ cities: ['화성시', '수원시'] })
  })
})
