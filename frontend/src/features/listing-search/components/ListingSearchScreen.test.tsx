import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ListingSearchScreen } from './ListingSearchScreen'
import { useListings } from '../hooks/useListings'
import { useFavoriteComplexes } from '../../favorites/hooks/useFavoriteComplexes'
import { useAddFavoriteComplex } from '../../favorites/hooks/useAddFavoriteComplex'
import { useRemoveFavoriteComplex } from '../../favorites/hooks/useRemoveFavoriteComplex'
import { useFavoritesSelectionStore } from '../../favorites/store/favoritesSelectionStore'
import { useCreateComparisonSet } from '../../comparison/hooks/useCreateComparisonSet'
import type { Listing } from '../../../shared/types/listing'
import type { FavoriteComplex } from '../../favorites/types'

vi.mock('../hooks/useListings', () => ({
  useListings: vi.fn(),
}))

vi.mock('../../favorites/hooks/useFavoriteComplexes', () => ({
  useFavoriteComplexes: vi.fn(),
}))

vi.mock('../../favorites/hooks/useAddFavoriteComplex', () => ({
  useAddFavoriteComplex: vi.fn(),
}))

vi.mock('../../favorites/hooks/useRemoveFavoriteComplex', () => ({
  useRemoveFavoriteComplex: vi.fn(),
}))

vi.mock('../../comparison/hooks/useCreateComparisonSet', () => ({
  useCreateComparisonSet: vi.fn(),
}))

const { mockMapView } = vi.hoisted(() => ({
  mockMapView: vi.fn((props: unknown) => {
    void props
    return <div data-testid="map-view-stub" />
  }),
}))

vi.mock('../../../shared/map/MapView', () => ({
  MapView: (props: unknown) => mockMapView(props),
}))

const mockedUseListings = vi.mocked(useListings)
const mockedUseFavoriteComplexes = vi.mocked(useFavoriteComplexes)
const mockedUseAddFavoriteComplex = vi.mocked(useAddFavoriteComplex)
const mockedUseRemoveFavoriteComplex = vi.mocked(useRemoveFavoriteComplex)
const mockedUseCreateComparisonSet = vi.mocked(useCreateComparisonSet)

function makeListing(id: number, overrides: Partial<Listing> = {}): Listing {
  return {
    id,
    complexId: id,
    salePrice: 95000 + id * 1000,
    exclusiveArea: 84.5,
    complex: {
      id,
      complexName: `단지${id}`,
      address: `서울시 테스트구 ${id}동`,
      completionYear: 2020,
      remodelingStatus: '해당없음',
      reconstructionStatus: '해당없음',
      isRegulatedArea: false,
      isLandTransactionPermissionZone: false,
      nearestShuttleStopName: '정류장1',
      nearestShuttleStopDistance: 100,
      shuttleCommuteMinutes: 30,
      latitude: 37.5 + id * 0.01,
      longitude: 127.0 + id * 0.01,
    },
    ...overrides,
  }
}

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<ListingSearchScreen />} />
        <Route path="/listings/:id" element={<div data-testid="detail-probe" />} />
        <Route path="/comparison-sets/:id" element={<div data-testid="comparison-probe" />} />
      </Routes>
    </MemoryRouter>,
  )
}

function baseQueryResult(overrides: Partial<ReturnType<typeof useListings>> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useListings>
}

function makeFavoriteComplex(complexId: number): FavoriteComplex {
  return {
    id: complexId,
    userProfileId: 1,
    complexId,
    registeredAt: '2026-01-01T00:00:00.000Z',
    complex: {
      id: complexId,
      complexName: `단지${complexId}`,
      address: `서울시 테스트구 ${complexId}동`,
      completionYear: 2020,
      remodelingStatus: '해당없음',
      reconstructionStatus: '해당없음',
      isRegulatedArea: false,
      isLandTransactionPermissionZone: false,
      nearestShuttleStopName: null,
      nearestShuttleStopDistance: null,
      shuttleCommuteMinutes: null,
    },
  }
}

function makeMutationResult(mutate: ReturnType<typeof vi.fn>) {
  return { mutate } as unknown as ReturnType<typeof useAddFavoriteComplex>
}

describe('ListingSearchScreen', () => {
  const createComparisonMutate = vi.fn()

  beforeEach(() => {
    mockedUseListings.mockReset()
    mockMapView.mockClear()
    mockedUseFavoriteComplexes.mockReset()
    mockedUseAddFavoriteComplex.mockReset()
    mockedUseRemoveFavoriteComplex.mockReset()
    mockedUseCreateComparisonSet.mockReset()
    createComparisonMutate.mockReset()
    useFavoritesSelectionStore.getState().clearComplexSelection()
    useFavoritesSelectionStore.getState().clearListingSelection()

    mockedUseFavoriteComplexes.mockReturnValue(
      baseQueryResult({ data: [] }) as unknown as ReturnType<typeof useFavoriteComplexes>,
    )
    mockedUseAddFavoriteComplex.mockReturnValue(makeMutationResult(vi.fn()))
    mockedUseRemoveFavoriteComplex.mockReturnValue(makeMutationResult(vi.fn()))
    mockedUseCreateComparisonSet.mockReturnValue({ mutate: createComparisonMutate } as unknown as ReturnType<
      typeof useCreateComparisonSet
    >)
  })

  it('로딩 중이면 불러오는 중... 을 표시한다', () => {
    mockedUseListings.mockReturnValue(baseQueryResult({ isLoading: true }))

    renderScreen()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러 발생 시 role=alert 로 표시하고 가격 필터는 계속 활성 상태이다', () => {
    mockedUseListings.mockReturnValue(baseQueryResult({ isError: true }))

    renderScreen()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    const spinbuttons = screen.getAllByRole('spinbutton')
    expect(spinbuttons).toHaveLength(2)
    spinbuttons.forEach((input) => expect(input).not.toBeDisabled())
  })

  it('데이터가 빈 배열이면 "조건에 맞는 매물이 0건입니다" 를 표시하고 필터는 계속 활성 상태이다', () => {
    mockedUseListings.mockReturnValue(baseQueryResult({ data: [] }))

    renderScreen()

    expect(screen.getByText('조건에 맞는 매물이 0건입니다')).toBeInTheDocument()
    const spinbuttons = screen.getAllByRole('spinbutton')
    expect(spinbuttons).toHaveLength(2)
    spinbuttons.forEach((input) => expect(input).not.toBeDisabled())
  })

  it('데이터가 있으면 매물 카드가 렌더링되고 MapView에 올바른 listings prop이 전달된다', () => {
    const listings = [makeListing(1), makeListing(2), makeListing(3)]
    mockedUseListings.mockReturnValue(baseQueryResult({ data: listings }))

    const { container } = renderScreen()

    const cards = container.querySelectorAll('.listing-card')
    expect(cards).toHaveLength(3)

    expect(mockMapView).toHaveBeenCalled()
    const lastCallProps = mockMapView.mock.calls[mockMapView.mock.calls.length - 1][0] as {
      listings: Array<{ id: number; lat: number; lng: number }>
    }
    expect(lastCallProps.listings).toEqual([
      { id: 1, lat: listings[0].complex.latitude, lng: listings[0].complex.longitude },
      { id: 2, lat: listings[1].complex.latitude, lng: listings[1].complex.longitude },
      { id: 3, lat: listings[2].complex.latitude, lng: listings[2].complex.longitude },
    ])
  })

  it('가격 필터를 변경하면 useListings가 갱신된 min/max 값으로 호출된다', async () => {
    mockedUseListings.mockReturnValue(baseQueryResult({ data: [] }))
    const user = userEvent.setup()

    renderScreen()

    const minInput = screen.getByLabelText('최소 매매가(만원)')
    await user.clear(minInput)
    await user.type(minInput, '80000')

    const calls = mockedUseListings.mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall).toEqual([80000, 150000])
  })

  it('모바일 토글 버튼 클릭 시 지도/목록 패널의 data-mobile-visible 속성이 전환된다', async () => {
    mockedUseListings.mockReturnValue(baseQueryResult({ data: [] }))
    const user = userEvent.setup()

    const { container } = renderScreen()

    const mapPanel = container.querySelector('.listing-search-screen__map')
    const listPanel = container.querySelector('.listing-search-screen__list')

    expect(listPanel).toHaveAttribute('data-mobile-visible', 'true')
    expect(mapPanel).toHaveAttribute('data-mobile-visible', 'false')

    await user.click(screen.getByRole('button', { name: '지도' }))

    expect(mapPanel).toHaveAttribute('data-mobile-visible', 'true')
    expect(listPanel).toHaveAttribute('data-mobile-visible', 'false')

    await user.click(screen.getByRole('button', { name: '목록' }))

    expect(listPanel).toHaveAttribute('data-mobile-visible', 'true')
    expect(mapPanel).toHaveAttribute('data-mobile-visible', 'false')
  })

  it('ListingCard 클릭 시 /listings/{id} 로 이동한다', async () => {
    const listings = [makeListing(1)]
    mockedUseListings.mockReturnValue(baseQueryResult({ data: listings }))
    const user = userEvent.setup()

    const { container } = renderScreen()

    const card = container.querySelector('.listing-card')
    expect(card).not.toBeNull()
    await user.click(card as Element)

    expect(screen.getByTestId('detail-probe')).toBeInTheDocument()
  })

  it('즐겨찾기가 아닌 단지의 별 아이콘을 클릭하면 useAddFavoriteComplex의 mutate가 호출되고 상세 이동은 발생하지 않는다', async () => {
    const listings = [makeListing(1)]
    mockedUseListings.mockReturnValue(baseQueryResult({ data: listings }))
    const addMutate = vi.fn()
    mockedUseAddFavoriteComplex.mockReturnValue(makeMutationResult(addMutate))
    const user = userEvent.setup()

    renderScreen()

    await user.click(screen.getByRole('button', { name: '즐겨찾기 추가' }))

    expect(addMutate).toHaveBeenCalledWith(1, expect.objectContaining({ onError: expect.any(Function) }))
    expect(screen.queryByTestId('detail-probe')).not.toBeInTheDocument()
  })

  it('이미 즐겨찾기된 단지의 별 아이콘을 클릭하면 useRemoveFavoriteComplex의 mutate가 호출된다', async () => {
    const listings = [makeListing(1)]
    mockedUseListings.mockReturnValue(baseQueryResult({ data: listings }))
    mockedUseFavoriteComplexes.mockReturnValue({
      data: [makeFavoriteComplex(1)],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFavoriteComplexes>)
    const removeMutate = vi.fn()
    mockedUseRemoveFavoriteComplex.mockReturnValue(makeMutationResult(removeMutate))
    const user = userEvent.setup()

    renderScreen()

    expect(screen.getByRole('button', { name: '즐겨찾기 해제' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '즐겨찾기 해제' }))

    expect(removeMutate).toHaveBeenCalledWith(1, expect.objectContaining({ onError: expect.any(Function) }))
  })

  it('MapView의 onMarkerClick 호출 시 /listings/{id} 로 이동한다', () => {
    const listings = [makeListing(1)]
    mockedUseListings.mockReturnValue(baseQueryResult({ data: listings }))

    renderScreen()

    const lastCallProps = mockMapView.mock.calls[mockMapView.mock.calls.length - 1][0] as {
      onMarkerClick: (id: number) => void
    }
    act(() => {
      lastCallProps.onMarkerClick(1)
    })

    expect(screen.getByTestId('detail-probe')).toBeInTheDocument()
  })

  it('비교셋에 추가 아이콘을 클릭하면 선택되고 하단 비교하기 바가 표시된다', async () => {
    const listings = [makeListing(1)]
    mockedUseListings.mockReturnValue(baseQueryResult({ data: listings }))
    const user = userEvent.setup()

    renderScreen()

    expect(screen.queryByText('비교하기')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '비교셋에 추가' }))

    expect(useFavoritesSelectionStore.getState().selectedComplexIds.has(1)).toBe(true)
    expect(screen.getByText('1개 선택됨')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비교하기' })).toBeInTheDocument()
    expect(screen.queryByTestId('detail-probe')).not.toBeInTheDocument()
  })

  it('1개만 선택 후 비교하기를 누르면 경고 모달이 표시되고 비교셋 생성은 호출되지 않는다', async () => {
    const listings = [makeListing(1)]
    mockedUseListings.mockReturnValue(baseQueryResult({ data: listings }))
    const user = userEvent.setup()

    renderScreen()

    await user.click(screen.getByRole('button', { name: '비교셋에 추가' }))
    await user.click(screen.getByRole('button', { name: '비교하기' }))

    expect(screen.getByText('비교하려면 2개 이상 선택해야 합니다')).toBeInTheDocument()
    expect(createComparisonMutate).not.toHaveBeenCalled()
  })

  it('2개 선택 후 비교하기를 누르면 비교셋을 생성하고 상세 페이지로 이동한다', async () => {
    const listings = [makeListing(1), makeListing(2)]
    mockedUseListings.mockReturnValue(baseQueryResult({ data: listings }))
    createComparisonMutate.mockImplementation((_input, options) => {
      options?.onSuccess?.({ id: 99, userProfileId: 1, targetType: 'complex', createdAt: '', complexes: [], listings: null })
    })
    const user = userEvent.setup()

    renderScreen()

    const addButtons = screen.getAllByRole('button', { name: '비교셋에 추가' })
    await user.click(addButtons[0])
    await user.click(addButtons[1])
    await user.click(screen.getByRole('button', { name: '비교하기' }))

    expect(createComparisonMutate).toHaveBeenCalledWith(
      { targetType: 'complex', complexIds: expect.arrayContaining([1, 2]) },
      expect.anything(),
    )
    expect(screen.getByTestId('comparison-probe')).toBeInTheDocument()
  })
})
