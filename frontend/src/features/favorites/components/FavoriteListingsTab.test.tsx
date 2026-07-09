import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FavoriteListingsTab } from './FavoriteListingsTab'
import { useFavoriteListings } from '../hooks/useFavoriteListings'
import { useRemoveFavoriteListing } from '../hooks/useRemoveFavoriteListing'
import { useFavoritesSelectionStore } from '../store/favoritesSelectionStore'
import { useCreateComparisonSet } from '../../comparison/hooks/useCreateComparisonSet'
import type { FavoriteListing } from '../types'

vi.mock('../hooks/useFavoriteListings')
vi.mock('../hooks/useRemoveFavoriteListing')
vi.mock('../../comparison/hooks/useCreateComparisonSet')

const mockedUseFavoriteListings = vi.mocked(useFavoriteListings)
const mockedUseRemoveFavoriteListing = vi.mocked(useRemoveFavoriteListing)
const mockedUseCreateComparisonSet = vi.mocked(useCreateComparisonSet)

function makeFavorite(overrides: Partial<FavoriteListing> = {}): FavoriteListing {
  return {
    id: 1,
    userProfileId: 1,
    listingId: 20,
    registeredAt: '2026-01-01T00:00:00.000Z',
    listing: {
      id: 20,
      complexId: 10,
      salePrice: 95000,
      exclusiveArea: 84.5,
      complex: {
        id: 10,
        complexName: '테스트단지',
        address: '서울시 테스트구',
        completionYear: 2020,
        remodelingStatus: '해당없음',
        reconstructionStatus: '해당없음',
        isRegulatedArea: false,
        isLandTransactionPermissionZone: false,
        nearestShuttleStopName: '정류장1',
        nearestShuttleStopDistance: 100,
        shuttleCommuteMinutes: 30,
        latitude: 37.5,
        longitude: 127.0,
      },
    },
    ...overrides,
  }
}

function makeFavorites(count: number): FavoriteListing[] {
  return Array.from({ length: count }, (_, i) =>
    makeFavorite({
      id: i + 1,
      listingId: i + 1,
      listing: { ...makeFavorite().listing, id: i + 1, complex: { ...makeFavorite().listing.complex, complexName: `매물${i + 1}` } },
    }),
  )
}

function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/favorites']}>
        <Routes>
          <Route path="/favorites" element={<FavoriteListingsTab />} />
          <Route path="/comparison-sets/:id" element={<div data-testid="comparison-probe" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FavoriteListingsTab', () => {
  const mutate = vi.fn()
  const createComparisonMutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useFavoritesSelectionStore.getState().clearComplexSelection()
    useFavoritesSelectionStore.getState().clearListingSelection()
    mockedUseRemoveFavoriteListing.mockReturnValue({ mutate } as unknown as ReturnType<
      typeof useRemoveFavoriteListing
    >)
    mockedUseCreateComparisonSet.mockReturnValue({ mutate: createComparisonMutate } as unknown as ReturnType<
      typeof useCreateComparisonSet
    >)
  })

  it('로딩 중이면 불러오는 중 메시지를 표시한다', () => {
    mockedUseFavoriteListings.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useFavoriteListings>)

    renderScreen()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러가 발생하면 에러 메시지를 표시한다', () => {
    mockedUseFavoriteListings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useFavoriteListings>)

    renderScreen()

    expect(screen.getByRole('alert')).toHaveTextContent('즐겨찾기 목록을 불러오지 못했습니다.')
  })

  it('데이터가 비어있으면 빈 상태 메시지를 표시한다', () => {
    mockedUseFavoriteListings.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFavoriteListings>)

    renderScreen()

    expect(screen.getByText('즐겨찾기한 매물이 없습니다')).toBeInTheDocument()
  })

  it('데이터가 있으면 매물 카드를 렌더링한다', () => {
    mockedUseFavoriteListings.mockReturnValue({
      data: [makeFavorite()],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFavoriteListings>)

    renderScreen()

    expect(screen.getByText('테스트단지')).toBeInTheDocument()
    expect(screen.getByText('서울시 테스트구')).toBeInTheDocument()
  })

  it('즐겨찾기 해제 버튼 클릭 시 listingId로 remove mutation을 호출한다', async () => {
    const user = userEvent.setup()
    mockedUseFavoriteListings.mockReturnValue({
      data: [makeFavorite({ listingId: 42 })],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFavoriteListings>)

    renderScreen()

    await user.click(screen.getByRole('button', { name: '즐겨찾기 해제' }))

    expect(mutate).toHaveBeenCalledWith(42)
  })

  it('체크박스 클릭 시 실제 스토어에서 선택 상태가 토글되고, 다시 클릭하면 선택 해제된다', async () => {
    const user = userEvent.setup()
    mockedUseFavoriteListings.mockReturnValue({
      data: [makeFavorite({ listingId: 20 })],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFavoriteListings>)

    renderScreen()

    const checkbox = screen.getByRole('checkbox', { name: '테스트단지 매물 선택' })

    await user.click(checkbox)
    expect(useFavoritesSelectionStore.getState().selectedListingIds.has(20)).toBe(true)

    await user.click(checkbox)
    expect(useFavoritesSelectionStore.getState().selectedListingIds.has(20)).toBe(false)
  })

  it('5개 초과 선택을 시도하면 6번째는 선택되지 않고 경고 모달이 표시된다 (시나리오 3-2 Case 1)', async () => {
    const user = userEvent.setup()
    const favorites = makeFavorites(6)
    mockedUseFavoriteListings.mockReturnValue({
      data: favorites,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFavoriteListings>)

    renderScreen()

    for (let i = 1; i <= 5; i++) {
      await user.click(screen.getByRole('checkbox', { name: `매물${i} 매물 선택` }))
    }
    expect(useFavoritesSelectionStore.getState().selectedListingIds.size).toBe(5)

    await user.click(screen.getByRole('checkbox', { name: '매물6 매물 선택' }))

    expect(useFavoritesSelectionStore.getState().selectedListingIds.size).toBe(5)
    expect(useFavoritesSelectionStore.getState().selectedListingIds.has(6)).toBe(false)
    expect(screen.getByRole('checkbox', { name: '매물6 매물 선택' })).not.toBeChecked()
    expect(screen.getByText('비교셋은 최대 5개까지 선택할 수 있습니다')).toBeInTheDocument()
  })

  it('1개만 선택 후 비교하기를 누르면 경고가 표시되고 비교셋 생성 mutation은 호출되지 않는다 (시나리오 3-2 Case 2)', async () => {
    const user = userEvent.setup()
    mockedUseFavoriteListings.mockReturnValue({
      data: makeFavorites(2),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFavoriteListings>)

    renderScreen()

    await user.click(screen.getByRole('checkbox', { name: '매물1 매물 선택' }))
    await user.click(screen.getByRole('button', { name: '비교하기' }))

    expect(screen.getByText('비교하려면 2개 이상 선택해야 합니다')).toBeInTheDocument()
    expect(createComparisonMutate).not.toHaveBeenCalled()
  })

  it('2개 선택 후 비교하기를 누르면 비교셋을 생성하고 상세 페이지로 이동한다', async () => {
    const user = userEvent.setup()
    mockedUseFavoriteListings.mockReturnValue({
      data: makeFavorites(2),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFavoriteListings>)
    createComparisonMutate.mockImplementation((_input, options) => {
      options?.onSuccess?.({ id: 99, userProfileId: 1, targetType: 'listing', createdAt: '', complexes: null, listings: [] })
    })

    renderScreen()

    await user.click(screen.getByRole('checkbox', { name: '매물1 매물 선택' }))
    await user.click(screen.getByRole('checkbox', { name: '매물2 매물 선택' }))
    await user.click(screen.getByRole('button', { name: '비교하기' }))

    expect(createComparisonMutate).toHaveBeenCalledWith(
      { targetType: 'listing', listingIds: expect.arrayContaining([1, 2]) },
      expect.anything(),
    )
    const [[calledInput]] = createComparisonMutate.mock.calls
    expect((calledInput as { listingIds: number[] }).listingIds).toHaveLength(2)
    expect(screen.getByTestId('comparison-probe')).toBeInTheDocument()
  })
})
