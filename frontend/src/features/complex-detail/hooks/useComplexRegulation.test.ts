import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useComplexRegulation, complexRegulationQueryKey } from './useComplexRegulation'
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

describe('useComplexRegulation', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('queryKey에 salePrice가 없으면 null로 대체된다', () => {
    expect(complexRegulationQueryKey('1')).toEqual(['complex-regulation', '1', null])
    expect(complexRegulationQueryKey('1', 95000)).toEqual(['complex-regulation', '1', 95000])
  })

  it('salePrice가 없으면 query parameter 없이 호출한다', async () => {
    mockedApiClient.mockResolvedValueOnce({ complexId: 1 })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useComplexRegulation('1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/complexes/1/regulation')
  })

  it('salePrice가 있으면 query parameter로 붙인다', async () => {
    mockedApiClient.mockResolvedValueOnce({ complexId: 1 })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useComplexRegulation('1', 95000), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/complexes/1/regulation?salePrice=95000')
  })
})
