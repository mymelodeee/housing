import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocalityTab } from './LocalityTab'
import { useListingLocality } from '../hooks/useListingLocality'
import { LocalityAxisList } from '../../../../shared/components/LocalityAxisList'
import type { LocalityInfo } from '../types'

vi.mock('../hooks/useListingLocality', () => ({
  useListingLocality: vi.fn(),
}))

vi.mock('../../../../shared/components/LocalityAxisList', () => ({
  LocalityAxisList: vi.fn(() => <div data-testid="locality-axis-list" />),
}))

const mockedUseListingLocality = vi.mocked(useListingLocality)
const mockedLocalityAxisList = vi.mocked(LocalityAxisList)

describe('LocalityTab', () => {
  beforeEach(() => {
    mockedUseListingLocality.mockReset()
    mockedLocalityAxisList.mockClear()
  })

  it('로딩 중일 때 불러오는 중 텍스트를 표시한다', () => {
    mockedUseListingLocality.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useListingLocality>)

    render(<LocalityTab listingId="1" />)

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러일 때 alert role을 표시하고 에러를 던지지 않는다', () => {
    mockedUseListingLocality.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as ReturnType<typeof useListingLocality>)

    expect(() => render(<LocalityTab listingId="1" />)).not.toThrow()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('성공 시 LocalityAxisList에 올바른 데이터를 전달하여 렌더링한다', () => {
    const locality: LocalityInfo = {
      listingId: 1,
      complexId: 1,
      completionYear: 1998,
      remodelingStatus: '완료',
      reconstructionStatus: '조합설립인가',
      nearbyRedevelopmentInfo: 'OO구역 재개발',
      localityAttributes: {
        transportation: '지하철 2호선 도보 5분',
        commercialArea: '대형 쇼핑몰 인접',
        schoolDistrict: '명문 학군',
        gangnamAccessibility: '강남까지 20분',
        entertainmentAndParks: '한강공원 인접',
        developmentProspects: 'GTX 개발 예정',
        nearbyJobs: 'IT 밸리 인접',
      },
    }
    mockedUseListingLocality.mockReturnValue({
      isLoading: false,
      isError: false,
      data: locality,
    } as ReturnType<typeof useListingLocality>)

    render(<LocalityTab listingId="1" />)

    expect(screen.getByTestId('locality-axis-list')).toBeInTheDocument()
    expect(mockedLocalityAxisList).toHaveBeenCalledWith({ data: locality }, undefined)
  })
})
