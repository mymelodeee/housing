import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useComplexJeonseHistory } from './useComplexJeonseHistory'
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

describe('useComplexJeonseHistory', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('exclusiveArea 없이 호출하면 query parameter 없이 요청한다', async () => {
    mockedApiClient.mockResolvedValueOnce({ complexId: 1, saleEntries: [], jeonseEntries: [], ratioEntries: [] })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useComplexJeonseHistory('1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/complexes/1/jeonse-history')
  })

  it('exclusiveArea가 있으면 query parameter로 붙여 호출한다', async () => {
    mockedApiClient.mockResolvedValueOnce({ complexId: 1, saleEntries: [], jeonseEntries: [], ratioEntries: [] })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useComplexJeonseHistory('1', 84.98), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/complexes/1/jeonse-history?exclusiveArea=84.98')
  })
})
