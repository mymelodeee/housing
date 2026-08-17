import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useListingAssignedSchools, listingAssignedSchoolsQueryKey } from './useListingAssignedSchools'
import { apiClient } from '../../../../shared/api/client'
import type { AssignedSchoolsResponse } from '../types'

vi.mock('../../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper }
}

const sampleResponse: AssignedSchoolsResponse = {
  listingId: 12,
  complexId: 8,
  elementarySchool: { schoolName: '동탄초등학교', distanceMeters: 320 },
  middleSchool: { schoolName: '동탄중학교', distanceMeters: 540 },
  assignmentNote: 'note',
}

describe('useListingAssignedSchools', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('queryKey는 listingId를 포함한다', () => {
    expect(listingAssignedSchoolsQueryKey('12')).toEqual(['listing-assigned-schools', '12'])
  })

  it('/api/listings/{id}/assigned-schools 를 호출하고 결과를 반환한다', async () => {
    mockedApiClient.mockResolvedValueOnce(sampleResponse)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useListingAssignedSchools('12'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/listings/12/assigned-schools')
    expect(result.current.data).toEqual(sampleResponse)
  })
})
