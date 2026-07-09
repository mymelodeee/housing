import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useListingLoanSimulation, loanSimulationQueryKey } from './useListingLoanSimulation'
import { apiClient } from '../../../shared/api/client'
import type { LoanSimulationResult } from '../types'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function createWrapper(queryClient: QueryClient) {
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return Wrapper
}

function makeResult(overrides: Partial<LoanSimulationResult> = {}): LoanSimulationResult {
  return {
    listingId: 123,
    profileIncomplete: false,
    scenarios: [],
    recommendedScenario: null,
    policyMortgageNotice: '정책모기지 안내',
    ...overrides,
  }
}

describe('useListingLoanSimulation', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('/api/listings/{id}/loan-simulation 를 호출하고 결과를 반환한다', async () => {
    const result = makeResult()
    mockedApiClient.mockResolvedValueOnce(result)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result: hookResult } = renderHook(() => useListingLoanSimulation('123'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(hookResult.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/123/loan-simulation')
    expect(hookResult.current.data).toEqual(result)
  })

  it('queryKey는 listing-loan-simulation과 listingId 이다', () => {
    expect(loanSimulationQueryKey('123')).toEqual(['listing-loan-simulation', '123'])
  })

  it('refetchOnMount: always 설정으로 인해 동일 QueryClient에서 재마운트 시 캐시 대신 새로 fetch 한다', async () => {
    const resultA = makeResult({ policyMortgageNotice: 'A' })
    const resultB = makeResult({ policyMortgageNotice: 'B' })
    mockedApiClient.mockResolvedValueOnce(resultA)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = createWrapper(queryClient)

    const first = renderHook(() => useListingLoanSimulation('123'), { wrapper })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    expect(first.result.current.data).toEqual(resultA)
    expect(mockedApiClient).toHaveBeenCalledTimes(1)

    first.unmount()

    mockedApiClient.mockResolvedValueOnce(resultB)

    const second = renderHook(() => useListingLoanSimulation('123'), { wrapper })
    await waitFor(() => expect(mockedApiClient).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(second.result.current.data).toEqual(resultB))
  })
})
