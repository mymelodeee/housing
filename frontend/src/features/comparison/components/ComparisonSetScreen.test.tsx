import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ComparisonSetScreen } from './ComparisonSetScreen'
import { useComparisonSet } from '../hooks/useComparisonSet'
import { useAddComplexToComparisonSet } from '../hooks/useAddComplexToComparisonSet'
import { useAddListingToComparisonSet } from '../hooks/useAddListingToComparisonSet'
import { useFavoriteComplexes } from '../../favorites/hooks/useFavoriteComplexes'
import { useFavoriteListings } from '../../favorites/hooks/useFavoriteListings'
import { ApiError } from '../../../shared/api/client'
import type { ComparisonComplexItem, ComparisonSetDetail } from '../types'
import type { LocalityAttributes } from '../../../shared/types/locality'
import type { FavoriteComplex } from '../../favorites/types'

vi.mock('../hooks/useComparisonSet')
vi.mock('../hooks/useAddComplexToComparisonSet')
vi.mock('../hooks/useAddListingToComparisonSet')
vi.mock('../../favorites/hooks/useFavoriteComplexes')
vi.mock('../../favorites/hooks/useFavoriteListings')

const mockedUseComparisonSet = vi.mocked(useComparisonSet)
const mockedUseAddComplexToComparisonSet = vi.mocked(useAddComplexToComparisonSet)
const mockedUseAddListingToComparisonSet = vi.mocked(useAddListingToComparisonSet)
const mockedUseFavoriteComplexes = vi.mocked(useFavoriteComplexes)
const mockedUseFavoriteListings = vi.mocked(useFavoriteListings)

const localityAttributes: LocalityAttributes = {
  transportation: '좋음',
  commercialArea: '보통',
  schoolDistrict: '좋음',
  gangnamAccessibility: '보통',
  entertainmentAndParks: '좋음',
  developmentProspects: '보통',
  nearbyJobs: '좋음',
}

function makeComplexItem(overrides: Partial<ComparisonComplexItem> = {}): ComparisonComplexItem {
  return {
    complexId: 1,
    complexName: '단지A',
    completionYear: 2020,
    remodelingStatus: '해당없음',
    reconstructionStatus: '해당없음',
    nearbyRedevelopmentInfo: '재개발 정보',
    localityAttributes,
    shuttleCommuteMinutes: 15,
    priceRange: { minPrice: 90000, maxPrice: 110000, avgPrice: 100000 },
    ...overrides,
  }
}

function makeFavoriteComplex(overrides: Partial<FavoriteComplex> = {}): FavoriteComplex {
  return {
    id: 1,
    userProfileId: 1,
    complexId: 99,
    registeredAt: '2026-01-01T00:00:00.000Z',
    complex: {
      id: 99,
      complexName: '추가가능단지',
      address: '서울시 테스트구',
      completionYear: 2019,
      remodelingStatus: '해당없음',
      reconstructionStatus: '해당없음',
      isRegulatedArea: false,
      isLandTransactionPermissionZone: false,
      nearestShuttleStopName: '정류장1',
      nearestShuttleStopDistance: 100,
      shuttleCommuteMinutes: 30,
      householdCount: null,
      buildingCount: null,
    },
    ...overrides,
  }
}

function renderScreen(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/comparison-sets/${id}`]}>
      <Routes>
        <Route path="/comparison-sets/:id" element={<ComparisonSetScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ComparisonSetScreen', () => {
  const addComplexMutate = vi.fn()
  const addListingMutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseAddComplexToComparisonSet.mockReturnValue({ mutate: addComplexMutate } as unknown as ReturnType<
      typeof useAddComplexToComparisonSet
    >)
    mockedUseAddListingToComparisonSet.mockReturnValue({ mutate: addListingMutate } as unknown as ReturnType<
      typeof useAddListingToComparisonSet
    >)
    mockedUseFavoriteComplexes.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useFavoriteComplexes>)
    mockedUseFavoriteListings.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useFavoriteListings>)
  })

  it('로딩 중이면 불러오는 중... 을 표시한다', () => {
    mockedUseComparisonSet.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useComparisonSet>)

    renderScreen()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러이면 role=alert 를 표시한다', () => {
    mockedUseComparisonSet.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useComparisonSet>)

    renderScreen()

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it("targetType이 complex이면 단지 비교 테이블이 렌더링된다", () => {
    const data: ComparisonSetDetail = {
      id: 1,
      userProfileId: 1,
      targetType: 'complex',
      createdAt: '2026-01-01T00:00:00.000Z',
      complexes: [makeComplexItem({ complexId: 1, complexName: '단지A' }), makeComplexItem({ complexId: 2, complexName: '단지B' })],
      listings: null,
    }
    mockedUseComparisonSet.mockReturnValue({
      data,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComparisonSet>)

    renderScreen()

    expect(screen.getByText('단지A')).toBeInTheDocument()
    expect(screen.getByText('단지B')).toBeInTheDocument()
    expect(screen.getByText('단지 시세')).toBeInTheDocument()
  })

  it("targetType이 listing이면 매물 비교 테이블이 렌더링된다", () => {
    const data: ComparisonSetDetail = {
      id: 1,
      userProfileId: 1,
      targetType: 'listing',
      createdAt: '2026-01-01T00:00:00.000Z',
      complexes: null,
      listings: [
        {
          listingId: 1,
          complexId: 1,
          salePrice: 95000,
          exclusiveArea: 84.5,
          complexName: '단지A',
          completionYear: 2020,
          remodelingStatus: '해당없음',
          reconstructionStatus: '해당없음',
          nearbyRedevelopmentInfo: null,
          localityAttributes,
          shuttleCommuteMinutes: 15,
        },
      ],
    }
    mockedUseComparisonSet.mockReturnValue({
      data,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComparisonSet>)

    renderScreen()

    expect(screen.getByText('매매가')).toBeInTheDocument()
    expect(screen.getByText('전용면적')).toBeInTheDocument()
  })

  it('중복 추가 시(409) 에러 메시지가 담긴 Modal이 표시되고 기존 테이블은 변경되지 않는다 (시나리오 3-3)', async () => {
    const user = userEvent.setup()
    const data: ComparisonSetDetail = {
      id: 1,
      userProfileId: 1,
      targetType: 'complex',
      createdAt: '2026-01-01T00:00:00.000Z',
      complexes: [makeComplexItem({ complexId: 1, complexName: '단지A' })],
      listings: null,
    }
    mockedUseComparisonSet.mockReturnValue({
      data,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComparisonSet>)
    mockedUseFavoriteComplexes.mockReturnValue({
      data: [makeFavoriteComplex({ complexId: 99 })],
    } as unknown as ReturnType<typeof useFavoriteComplexes>)
    addComplexMutate.mockImplementation((_id, options) => {
      options?.onError?.(new ApiError(409, '중복입니다'))
    })

    const { container } = renderScreen()

    await user.selectOptions(screen.getByLabelText('추가할 단지 선택'), '99')
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('중복입니다')
    const columnHeaders = container.querySelectorAll('table thead th')
    // 첫 번째는 빈 헤더, 두 번째부터 단지 컬럼 (테이블에는 여전히 단지A 1개만 존재해야 함)
    expect(columnHeaders).toHaveLength(2)
    expect(columnHeaders[1]).toHaveTextContent('단지A')
  })
})
