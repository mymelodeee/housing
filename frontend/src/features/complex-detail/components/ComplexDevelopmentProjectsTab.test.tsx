import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplexDevelopmentProjectsTab } from './ComplexDevelopmentProjectsTab'
import { useComplexDevelopmentProjects } from '../hooks/useComplexDevelopmentProjects'

vi.mock('../hooks/useComplexDevelopmentProjects', () => ({ useComplexDevelopmentProjects: vi.fn() }))

const mockedUseComplexDevelopmentProjects = vi.mocked(useComplexDevelopmentProjects)

function mockResult(data: unknown) {
  return { data, isLoading: false, isError: false } as unknown as ReturnType<typeof useComplexDevelopmentProjects>
}

describe('ComplexDevelopmentProjectsTab', () => {
  it('등록된 개발호재가 없으면 안내 문구를 표시한다', () => {
    mockedUseComplexDevelopmentProjects.mockReturnValue(mockResult({ complexId: 1, projects: [] }))

    render(<ComplexDevelopmentProjectsTab complexId="1" />)

    expect(screen.getByText('등록된 개발호재 없음')).toBeInTheDocument()
  })

  it('프로젝트 카드와 상태 배지, 출처 링크를 표시한다', () => {
    mockedUseComplexDevelopmentProjects.mockReturnValue(
      mockResult({
        complexId: 1,
        projects: [
          {
            id: 1,
            projectName: 'GTX-A 동탄역',
            category: '철도',
            status: '착공',
            effectiveDate: '2025-11-18',
            checkedAt: '2026-09-01',
            note: '2028년 개통 예정',
            sources: [
              {
                name: '국토교통부',
                url: 'https://example.test',
                sourceType: '보도자료',
                sourceDate: '2025-11-01',
                checkedAt: '2026-09-01',
                reliability: 'high',
                isAccessible: true,
              },
            ],
          },
        ],
      })
    )

    render(<ComplexDevelopmentProjectsTab complexId="1" />)

    expect(screen.getByText('GTX-A 동탄역')).toBeInTheDocument()
    expect(screen.getByText('착공')).toBeInTheDocument()
    expect(screen.getByText('2028년 개통 예정')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '국토교통부' })).toHaveAttribute('href', 'https://example.test')
  })

  it('로딩 중이면 로딩 문구를 표시한다', () => {
    mockedUseComplexDevelopmentProjects.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useComplexDevelopmentProjects>)

    render(<ComplexDevelopmentProjectsTab complexId="1" />)

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })
})
