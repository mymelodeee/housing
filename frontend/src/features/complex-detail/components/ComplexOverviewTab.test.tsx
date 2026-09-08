import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComplexOverviewTab } from './ComplexOverviewTab'
import { useComplex } from '../hooks/useComplex'
import { useComplexRemodeling } from '../hooks/useComplexRemodeling'
import type { ComplexDetail } from '../hooks/useComplex'

vi.mock('../hooks/useComplex', () => ({ useComplex: vi.fn() }))
vi.mock('../hooks/useComplexRemodeling', () => ({ useComplexRemodeling: vi.fn() }))

const mockedUseComplex = vi.mocked(useComplex)
const mockedUseComplexRemodeling = vi.mocked(useComplexRemodeling)

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
    gangnamAccessibility: '정보 없음',
    entertainmentAndParks: '정보 없음',
    nearbyJobs: '정보 없음',
  },
  priceRange: '매물 없음',
}

describe('ComplexOverviewTab', () => {
  beforeEach(() => {
    mockedUseComplexRemodeling.mockReturnValue({
      data: { complexId: 1, hasProject: false, message: '등록된 리모델링 정보가 없습니다.' },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplexRemodeling>)
  })

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

  it('리모델링 정보가 없으면 추진 여부를 해당없음으로 표시한다', () => {
    mockedUseComplex.mockReturnValue({ data: baseComplex, isLoading: false, isError: false } as unknown as ReturnType<typeof useComplex>)

    render(<ComplexOverviewTab complexId="1" />)

    const remodelingLabel = screen.getByText('리모델링 추진 여부')
    expect(remodelingLabel).toBeInTheDocument()
    expect(remodelingLabel.nextElementSibling).toHaveTextContent('해당없음')
    expect(screen.queryByRole('button', { name: '리모델링 상세 보기' })).not.toBeInTheDocument()
  })

  it('실제 current stage를 표시하고 상세 버튼 클릭을 전달한다', async () => {
    const user = userEvent.setup()
    const onRemodelingDetails = vi.fn()
    mockedUseComplex.mockReturnValue({ data: baseComplex, isLoading: false, isError: false } as unknown as ReturnType<typeof useComplex>)
    mockedUseComplexRemodeling.mockReturnValue({
      data: {
        complexId: 1,
        hasProject: true,
        projectName: '테스트 리모델링',
        complexName: baseComplex.complexName,
        currentStage: { value: '조합설립인가' },
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplexRemodeling>)

    render(<ComplexOverviewTab complexId="1" onRemodelingDetails={onRemodelingDetails} />)

    expect(screen.getByText('조합설립인가')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '리모델링 상세 보기' }))
    expect(onRemodelingDetails).toHaveBeenCalledOnce()
  })
})
