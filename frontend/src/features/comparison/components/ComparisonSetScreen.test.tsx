import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ComparisonSetScreen } from './ComparisonSetScreen'
import { useComparisonSet } from '../hooks/useComparisonSet'
import { useAddComplexToComparisonSet } from '../hooks/useAddComplexToComparisonSet'
import { useAddListingToComparisonSet } from '../hooks/useAddListingToComparisonSet'
import { useAllComplexes } from '../hooks/useAllComplexes'
import { useFavoriteListings } from '../../favorites/hooks/useFavoriteListings'
import { ApiError } from '../../../shared/api/client'
import type { ComparisonComplexItem, ComparisonSetDetail } from '../types'
import type { LocalityAttributes } from '../../../shared/types/locality'
import type { ApartmentComplexSummary } from '../../../shared/types/listing'

vi.mock('../hooks/useComparisonSet')
vi.mock('../hooks/useAddComplexToComparisonSet')
vi.mock('../hooks/useAddListingToComparisonSet')
vi.mock('../hooks/useAllComplexes')
vi.mock('../../favorites/hooks/useFavoriteListings')

const mockedUseComparisonSet = vi.mocked(useComparisonSet)
const mockedUseAddComplexToComparisonSet = vi.mocked(useAddComplexToComparisonSet)
const mockedUseAddListingToComparisonSet = vi.mocked(useAddListingToComparisonSet)
const mockedUseAllComplexes = vi.mocked(useAllComplexes)
const mockedUseFavoriteListings = vi.mocked(useFavoriteListings)

const localityAttributes: LocalityAttributes = {
  transportation: '좋음',
  commercialArea: '보통',
  gangnamAccessibility: '보통',
  entertainmentAndParks: '좋음',
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

function makeComplexSummary(overrides: Partial<ApartmentComplexSummary> = {}): ApartmentComplexSummary {
  return {
    id: 99,
    complexName: '추가가능단지',
    address: '서울 강동구 길동 483',
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
    mockedUseAllComplexes.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useAllComplexes>)
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
    mockedUseAllComplexes.mockReturnValue({
      data: [makeComplexSummary({ id: 99, complexName: '추가가능단지', address: '서울 강동구 길동 483' })],
    } as unknown as ReturnType<typeof useAllComplexes>)
    addComplexMutate.mockImplementation((_id, options) => {
      options?.onError?.(new ApiError(409, '중복입니다'))
    })

    const { container } = renderScreen()

    await user.selectOptions(screen.getByLabelText('시/군/구 선택'), '서울 강동구')
    await user.selectOptions(screen.getByLabelText('동 선택'), '길동')
    await user.selectOptions(screen.getByLabelText('단지 선택'), '99')
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('중복입니다')
    const columnHeaders = container.querySelectorAll('table thead th')
    // 첫 번째는 빈 헤더, 두 번째부터 단지 컬럼 (테이블에는 여전히 단지A 1개만 존재해야 함)
    expect(columnHeaders).toHaveLength(2)
    expect(columnHeaders[1]).toHaveTextContent('단지A')
  })

  it('시/군/구 > 동 > 단지명 순으로 단계적으로 선택해야 추가 버튼이 활성화된다(즐겨찾기 목록이 아닌 전체 단지 목록을 사용)', async () => {
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
    mockedUseAllComplexes.mockReturnValue({
      data: [
        makeComplexSummary({ id: 12, complexName: '강동헤리티지자이', address: '서울 강동구 길동 483' }),
        makeComplexSummary({ id: 42, complexName: '동분당더퍼스트', address: '성남시 중원구 도촌동 704' }),
      ],
    } as unknown as ReturnType<typeof useAllComplexes>)

    renderScreen()

    const addButton = screen.getByRole('button', { name: '추가' })
    expect(addButton).toBeDisabled()
    expect(screen.getByLabelText('동 선택')).toBeDisabled()
    expect(screen.getByLabelText('단지 선택')).toBeDisabled()

    await user.selectOptions(screen.getByLabelText('시/군/구 선택'), '성남시 중원구')
    expect(screen.getByLabelText('동 선택')).not.toBeDisabled()
    expect(screen.queryByRole('option', { name: '강동헤리티지자이' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('동 선택'), '도촌동')
    expect(screen.getByLabelText('단지 선택')).not.toBeDisabled()
    expect(screen.getByRole('option', { name: '동분당더퍼스트' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('단지 선택'), '42')
    expect(addButton).not.toBeDisabled()

    await user.click(addButton)
    expect(addComplexMutate).toHaveBeenCalledWith(42, expect.anything())
  })
})
