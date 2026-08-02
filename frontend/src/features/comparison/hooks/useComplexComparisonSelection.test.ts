import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { createElement, type ReactNode } from 'react'
import { useComplexComparisonSelection } from './useComplexComparisonSelection'
import { useFavoritesSelectionStore } from '../../favorites/store/favoritesSelectionStore'
import { apiClient } from '../../../shared/api/client'
import type { ComparisonSetDetail } from '../types'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, createElement(MemoryRouter, null, children))
  return { Wrapper }
}

describe('useComplexComparisonSelection', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
    useFavoritesSelectionStore.getState().clearComplexSelection()
  })

  it('5개 초과 선택을 시도하면 6번째는 선택되지 않고 경고 모달 상태가 설정된다', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useComplexComparisonSelection(), { wrapper: Wrapper })

    act(() => {
      for (let id = 1; id <= 5; id++) result.current.handleToggle(id)
    })
    expect(useFavoritesSelectionStore.getState().selectedComplexIds.size).toBe(5)

    act(() => {
      result.current.handleToggle(6)
    })

    expect(useFavoritesSelectionStore.getState().selectedComplexIds.has(6)).toBe(false)
    expect(result.current.warningModal).toEqual({
      title: '선택 제한',
      body: '비교셋은 최대 5개까지 선택할 수 있습니다',
    })
  })

  it('1개만 선택 후 비교하기를 호출하면 경고 모달 상태가 설정되고 mutation은 호출되지 않는다', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useComplexComparisonSelection(), { wrapper: Wrapper })

    act(() => {
      result.current.handleToggle(1)
    })
    act(() => {
      result.current.handleCompare()
    })

    expect(result.current.warningModal).toEqual({
      title: '선택 부족',
      body: '비교하려면 2개 이상 선택해야 합니다',
    })
    expect(mockedApiClient).not.toHaveBeenCalled()
  })

  it('2개 선택 후 비교하기를 호출하면 비교셋 생성 API를 호출하고 성공 시 선택이 초기화된다', async () => {
    const result: ComparisonSetDetail = {
      id: 99,
      userProfileId: 1,
      targetType: 'complex',
      createdAt: '2026-01-01T00:00:00.000Z',
      complexes: [],
      listings: null,
    }
    mockedApiClient.mockResolvedValueOnce(result)

    const { Wrapper } = createWrapper()
    const { result: hookResult } = renderHook(() => useComplexComparisonSelection(), { wrapper: Wrapper })

    act(() => {
      hookResult.current.handleToggle(1)
      hookResult.current.handleToggle(2)
    })
    act(() => {
      hookResult.current.handleCompare()
    })

    await waitFor(() => expect(useFavoritesSelectionStore.getState().selectedComplexIds.size).toBe(0))

    expect(mockedApiClient).toHaveBeenCalledWith('/api/comparison-sets', {
      method: 'POST',
      body: { targetType: 'complex', complexIds: expect.arrayContaining([1, 2]) },
    })
  })

  it('closeWarningModal을 호출하면 경고 모달 상태가 초기화된다', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useComplexComparisonSelection(), { wrapper: Wrapper })

    act(() => {
      result.current.handleCompare()
    })
    expect(result.current.warningModal).not.toBeNull()

    act(() => {
      result.current.closeWarningModal()
    })
    expect(result.current.warningModal).toBeNull()
  })
})
