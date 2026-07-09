import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useUpdateUserProfile } from './useUpdateUserProfile'
import { userProfileQueryKey } from './useUserProfile'
import { apiClient } from '../../../shared/api/client'
import type { UserProfile, UserProfileUpdateRequest } from '../types'

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

describe('useUpdateUserProfile', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('PUT /api/user-profile 로 patch를 전송하고 성공 시 캐시를 무효화한다', async () => {
    const patch: Required<UserProfileUpdateRequest> = {
      ownershipStructure: '단독',
      annualIncome: 6000,
      annualBonus: 0,
      availableCapital: 15000,
      housingOwnershipTier: '무주택',
      isFirstTimeBuyer: true,
    }
    const updated: UserProfile = { id: 1, workplace: null, ...patch }
    mockedApiClient.mockResolvedValueOnce(updated)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateUserProfile(), { wrapper: Wrapper })

    result.current.mutate(patch)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/user-profile', {
      method: 'PUT',
      body: patch,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userProfileQueryKey })
  })
})
