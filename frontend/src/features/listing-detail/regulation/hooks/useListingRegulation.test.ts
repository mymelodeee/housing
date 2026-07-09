import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useListingRegulation, listingRegulationQueryKey } from './useListingRegulation'
import { apiClient } from '../../../../shared/api/client'
import type { RegulationInfo } from '../types'

vi.mock('../../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper, queryClient }
}

describe('useListingRegulation', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('/api/listings/{id}/regulation 를 호출하고 결과를 반환한다', async () => {
    const regulation: RegulationInfo = {
      listingId: 1,
      complexId: 1,
      isRegulatedArea: true,
      isLandTransactionPermissionZone: true,
      regulationConfirmationNeeded: false,
      ltvPercent: 50,
      maxLoanAmount: 60000,
      profileMessage: null,
      gapInvestmentAllowed: false,
      occupancyRequirementMonths: 6,
      regionalLoanCapAmount: 60000,
    }
    mockedApiClient.mockResolvedValueOnce(regulation)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useListingRegulation('1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/1/regulation')
    expect(result.current.data).toEqual(regulation)
  })

  it('queryKey는 listing-regulation과 listingId 이다', () => {
    expect(listingRegulationQueryKey('1')).toEqual(['listing-regulation', '1'])
  })

  it('queryKey 캐시 아래에 데이터가 저장된다', async () => {
    const regulation: RegulationInfo = {
      listingId: 2,
      complexId: 2,
      isRegulatedArea: false,
      isLandTransactionPermissionZone: '확인필요',
      regulationConfirmationNeeded: true,
      ltvPercent: 70,
      maxLoanAmount: 50000,
      profileMessage: null,
      gapInvestmentAllowed: true,
      occupancyRequirementMonths: null,
      regionalLoanCapAmount: null,
    }
    mockedApiClient.mockResolvedValueOnce(regulation)

    const { Wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => useListingRegulation('2'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(listingRegulationQueryKey('2'))).toEqual(regulation)
  })
})
