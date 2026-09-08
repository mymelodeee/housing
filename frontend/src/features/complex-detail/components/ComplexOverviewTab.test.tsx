import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplexOverviewTab } from './ComplexOverviewTab'
import { useComplex } from '../hooks/useComplex'
import type { ComplexDetail } from '../hooks/useComplex'

vi.mock('../hooks/useComplex', () => ({ useComplex: vi.fn() }))

const mockedUseComplex = vi.mocked(useComplex)

const baseComplex: ComplexDetail = {
  id: 1,
  complexName: '수지초입마을아파트',
  address: '경기도 용인시 수지구',
  completionYear: 1998,
  remodelingStatus: '해당없음',
  reconstructionStatus: '해당없음',
  isRegulatedArea: false,
  isLandTransactionPermissionZone: '확인필요',
  nearestShuttleStopName: null,
  nearestShuttleStopDistance: null,
  shuttleCommuteMinutes: null,
  householdCount: 1620,
  buildingCount: 14,
  latitude: 37.1,
  longitude: 127.1,
  remodelingCompletionYear: null,
  nearbyRedevelopmentInfo: null,
  localityAttributes: {
    transportation: '정보 없음',
    commercialArea: '정보 없음',
    schoolDistrict: '정보 없음',
    gangnamAccessibility: '정보 없음',
    entertainmentAndParks: '정보 없음',
    developmentProspects: '정보 없음',
    nearbyJobs: '정보 없음',
  },
  priceRange: '매물 없음',
}

describe('ComplexOverviewTab', () => {
  it('세대수와 동수를 함께 표시한다', () => {
    mockedUseComplex.mockReturnValue({
      data: baseComplex,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplex>)

    render(<ComplexOverviewTab complexId="1" />)

    expect(screen.getByText('1,620세대 · 14개동')).toBeInTheDocument()
  })

  it('세대수/동수가 없으면 확인필요로 표시한다', () => {
    mockedUseComplex.mockReturnValue({
      data: { ...baseComplex, householdCount: null, buildingCount: null },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplex>)

    render(<ComplexOverviewTab complexId="1" />)

    expect(screen.getByText('세대수 확인필요 · 동수 확인필요')).toBeInTheDocument()
  })
})
