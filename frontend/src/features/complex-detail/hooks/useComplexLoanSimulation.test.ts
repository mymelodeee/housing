import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useComplexLoanSimulation } from './useComplexLoanSimulation'
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

describe('useComplexLoanSimulation', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('salePrice가 있으면 query parameter로 붙여 호출한다', async () => {
    mockedApiClient.mockResolvedValueOnce({ complexId: 1, profileIncomplete: false, scenarios: [] })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useComplexLoanSimulation('1', 95000), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/complexes/1/loan-simulation?salePrice=95000')
  })
})
