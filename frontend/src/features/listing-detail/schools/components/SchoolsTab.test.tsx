import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SchoolsTab } from './SchoolsTab'
import { useListingAssignedSchools } from '../hooks/useListingAssignedSchools'
import type { AssignedSchoolsResponse } from '../types'

vi.mock('../hooks/useListingAssignedSchools', () => ({
  useListingAssignedSchools: vi.fn(),
}))

const mockedHook = vi.mocked(useListingAssignedSchools)

function mockResult(overrides: Partial<ReturnType<typeof useListingAssignedSchools>>) {
  return { data: undefined, isLoading: false, isError: false, ...overrides } as ReturnType<
    typeof useListingAssignedSchools
  >
}

const sampleData: AssignedSchoolsResponse = {
  listingId: 12,
  complexId: 8,
  elementarySchool: { schoolName: '동탄초등학교', distanceMeters: 320 },
  middleSchool: { schoolName: '동탄중학교', distanceMeters: 1540 },
  assignmentNote: '최근접 학교 기준 근사치이며, 실제 배정은 교육청 학구도에 따라 달라질 수 있습니다',
}

describe('SchoolsTab', () => {
  beforeEach(() => {
    mockedHook.mockReset()
  })

  it('로딩 중이면 불러오는 중...을 표시한다', () => {
    mockedHook.mockReturnValue(mockResult({ isLoading: true }))
    render(<SchoolsTab listingId="12" />)
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러이면 role=alert 메시지를 표시한다', () => {
    mockedHook.mockReturnValue(mockResult({ isError: true }))
    render(<SchoolsTab listingId="12" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('초·중학교 이름과 거리(m)를 표시한다', () => {
    mockedHook.mockReturnValue(mockResult({ data: sampleData }))
    render(<SchoolsTab listingId="12" />)

    expect(screen.getByText('초등학교')).toBeInTheDocument()
    expect(screen.getByText('동탄초등학교 (320m)')).toBeInTheDocument()
    expect(screen.getByText('중학교')).toBeInTheDocument()
    expect(screen.getByText('동탄중학교 (1,540m)')).toBeInTheDocument()
    expect(screen.getByText(sampleData.assignmentNote)).toBeInTheDocument()
  })

  it('학교 데이터가 없으면 정보 없음을 표시한다', () => {
    mockedHook.mockReturnValue(mockResult({ data: { ...sampleData, elementarySchool: null, middleSchool: null } }))
    render(<SchoolsTab listingId="12" />)

    expect(screen.getAllByText('정보 없음')).toHaveLength(2)
  })
})
