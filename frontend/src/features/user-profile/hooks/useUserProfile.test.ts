import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useUserProfile, userProfileQueryKey } from './useUserProfile'
import { apiClient } from '../../../shared/api/client'
import type { UserProfile } from '../types'

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

describe('useUserProfile', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('/api/user-profile 를 호출하고 결과를 반환한다', async () => {
    const profile: UserProfile = {
      id: 1,
      workplace: '화성',
      ownershipStructure: '단독',
      annualIncome: 5000,
      annualBonus: 500,
      availableCapital: 10000,
      housingOwnershipTier: '무주택',
      isFirstTimeBuyer: true,
    }
    mockedApiClient.mockResolvedValueOnce(profile)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUserProfile(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/user-profile')
    expect(result.current.data).toEqual(profile)
  })

  it('queryKey는 user-profile 이다', () => {
    expect(userProfileQueryKey).toEqual(['user-profile'])
  })

  it('queryKey 캐시 아래에 데이터가 저장된다', async () => {
    const profile: UserProfile = {
      id: 1,
      workplace: null,
      ownershipStructure: null,
      annualIncome: null,
      annualBonus: null,
      availableCapital: null,
      housingOwnershipTier: null,
      isFirstTimeBuyer: null,
    }
    mockedApiClient.mockResolvedValueOnce(profile)

    const { Wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => useUserProfile(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(userProfileQueryKey)).toEqual(profile)
  })
})
