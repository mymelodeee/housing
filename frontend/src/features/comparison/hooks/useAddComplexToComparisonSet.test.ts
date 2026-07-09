import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useAddComplexToComparisonSet } from './useAddComplexToComparisonSet'
import { comparisonSetQueryKey } from './useComparisonSet'
import { apiClient, ApiError } from '../../../shared/api/client'
import type { ComparisonSetDetail } from '../types'

vi.mock('../../../shared/api/client', async () => {
  const actual = await vi.importActual<typeof import('../../../shared/api/client')>(
    '../../../shared/api/client',
  )
  return {
    ...actual,
    apiClient: vi.fn(),
  }
})

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper, queryClient }
}

describe('useAddComplexToComparisonSet', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('POST /api/comparison-sets/{setId}/complexes 로 complexId를 전송하고 캐시를 무효화한다', async () => {
    const data: ComparisonSetDetail = {
      id: 5,
      userProfileId: 1,
      targetType: 'complex',
      createdAt: '2026-01-01T00:00:00.000Z',
      complexes: [],
      listings: null,
    }
    mockedApiClient.mockResolvedValueOnce(data)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAddComplexToComparisonSet('5'), { wrapper: Wrapper })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/comparison-sets/5/complexes', {
      method: 'POST',
      body: { complexId: 3 },
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: comparisonSetQueryKey('5') })
  })

  it('409 응답 시 ApiError(중복입니다)가 그대로 전파된다', async () => {
    mockedApiClient.mockRejectedValueOnce(new ApiError(409, '중복입니다'))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useAddComplexToComparisonSet('5'), { wrapper: Wrapper })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).message).toBe('중복입니다')
  })
})
