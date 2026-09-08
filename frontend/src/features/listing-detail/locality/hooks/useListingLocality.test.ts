import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useListingLocality, listingLocalityQueryKey } from './useListingLocality'
import { apiClient } from '../../../../shared/api/client'
import type { LocalityInfo } from '../types'

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

describe('useListingLocality', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('/api/listings/{id}/locality 를 호출하고 결과를 반환한다', async () => {
    const locality: LocalityInfo = {
      listingId: 1,
      complexId: 1,
      completionYear: 1998,
      remodelingStatus: '완료',
      reconstructionStatus: '조합설립인가',
      nearbyRedevelopmentInfo: 'OO구역 재개발',
      localityAttributes: {
        transportation: '지하철 2호선 도보 5분',
        commercialArea: '대형 쇼핑몰 인접',
        gangnamAccessibility: '강남까지 20분',
        entertainmentAndParks: '한강공원 인접',
        nearbyJobs: 'IT 밸리 인접',
      },
    }
    mockedApiClient.mockResolvedValueOnce(locality)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useListingLocality('1'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/1/locality')
    expect(result.current.data).toEqual(locality)
  })

  it('queryKey는 listing-locality와 listingId 이다', () => {
    expect(listingLocalityQueryKey('1')).toEqual(['listing-locality', '1'])
  })

  it('서로 다른 listingId는 별도의 캐시 항목을 생성한다', async () => {
    const locality1: LocalityInfo = {
      listingId: 1,
      complexId: 1,
      completionYear: 1998,
      remodelingStatus: '완료',
      reconstructionStatus: '조합설립인가',
      nearbyRedevelopmentInfo: 'OO구역 재개발',
      localityAttributes: {
        transportation: '지하철 2호선 도보 5분',
        commercialArea: '대형 쇼핑몰 인접',
        gangnamAccessibility: '강남까지 20분',
        entertainmentAndParks: '한강공원 인접',
        nearbyJobs: 'IT 밸리 인접',
      },
    }
    const locality2: LocalityInfo = {
      listingId: 2,
      complexId: 2,
      completionYear: 2020,
      remodelingStatus: '해당없음',
      reconstructionStatus: '해당없음',
      nearbyRedevelopmentInfo: null,
      localityAttributes: {
        transportation: '정보 없음',
        commercialArea: '정보 없음',
        gangnamAccessibility: '정보 없음',
        entertainmentAndParks: '정보 없음',
        nearbyJobs: '정보 없음',
      },
    }
    mockedApiClient.mockResolvedValueOnce(locality1)
    mockedApiClient.mockResolvedValueOnce(locality2)

    const { Wrapper, queryClient } = createWrapper()

    const { result: result1 } = renderHook(() => useListingLocality('1'), { wrapper: Wrapper })
    await waitFor(() => expect(result1.current.isSuccess).toBe(true))

    const { result: result2 } = renderHook(() => useListingLocality('2'), { wrapper: Wrapper })
    await waitFor(() => expect(result2.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(listingLocalityQueryKey('1'))).toEqual(locality1)
    expect(queryClient.getQueryData(listingLocalityQueryKey('2'))).toEqual(locality2)
  })
})
