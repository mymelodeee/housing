import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplexSchoolsTab } from './ComplexSchoolsTab'
import { useComplexAssignedSchools } from '../hooks/useComplexAssignedSchools'

vi.mock('../hooks/useComplexAssignedSchools', () => ({ useComplexAssignedSchools: vi.fn() }))

const mockedUseComplexAssignedSchools = vi.mocked(useComplexAssignedSchools)

describe('ComplexSchoolsTab', () => {
  it('초/중/고 배정학교를 모두 표시한다', () => {
    mockedUseComplexAssignedSchools.mockReturnValue({
      data: {
        complexId: 1,
        elementarySchool: { schoolName: 'A초등학교', distanceMeters: 300 },
        middleSchool: { schoolName: 'B중학교', distanceMeters: 500 },
        highSchool: { schoolName: 'C고등학교', distanceMeters: 800 },
        assignmentNote: '근사치입니다',
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplexAssignedSchools>)

    render(<ComplexSchoolsTab complexId="1" />)

    expect(screen.getByText('고등학교')).toBeInTheDocument()
    expect(screen.getByText('C고등학교 (800m)')).toBeInTheDocument()
  })

  it('고등학교 정보가 없으면 정보 없음을 표시한다', () => {
    mockedUseComplexAssignedSchools.mockReturnValue({
      data: {
        complexId: 1,
        elementarySchool: null,
        middleSchool: null,
        highSchool: null,
        assignmentNote: '근사치입니다',
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplexAssignedSchools>)

    render(<ComplexSchoolsTab complexId="1" />)

    expect(screen.getAllByText('정보 없음')).toHaveLength(3)
  })
})
