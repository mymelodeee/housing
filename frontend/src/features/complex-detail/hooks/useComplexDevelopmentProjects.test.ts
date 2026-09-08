import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useComplexDevelopmentProjects } from './useComplexDevelopmentProjects'
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

describe('useComplexDevelopmentProjects', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('단지 id로 개발호재 목록을 요청한다', async () => {
    mockedApiClient.mockResolvedValueOnce({ complexId: 1, projects: [] })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useComplexDevelopmentProjects('1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/complexes/1/development-projects')
  })
})
