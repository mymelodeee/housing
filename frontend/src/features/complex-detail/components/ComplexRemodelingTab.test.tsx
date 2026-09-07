import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplexRemodelingTab } from './ComplexRemodelingTab'
import { useComplexRemodeling } from '../hooks/useComplexRemodeling'

vi.mock('../hooks/useComplexRemodeling', () => ({
  useComplexRemodeling: vi.fn(),
}))

const mockedUseComplexRemodeling = vi.mocked(useComplexRemodeling)

describe('ComplexRemodelingTab', () => {
  beforeEach(() => {
    mockedUseComplexRemodeling.mockReset()
  })

  it('리모델링 후 세대수가 미확인이어도 기존 세대수와 메타정보를 표시한다', () => {
    mockedUseComplexRemodeling.mockReturnValue({
      data: {
        complexId: 31,
        hasProject: true,
        projectName: '수지초입마을아파트 리모델링주택조합',
        complexName: '수지초입마을아파트',
        currentStage: {
          value: '이주',
          status: 'confirmed',
          effectiveDate: '2025-12-05',
          checkedAt: '2026-09-07',
          daysSinceChecked: 1,
          isStale: false,
          isConflicted: false,
          source: { name: '경인신문', url: null, sourceDate: '2025-12-05', reliability: 'medium' },
        },
        households: {
          before: 1620,
          after: null,
          increase: null,
          status: 'unknown',
          effectiveDate: null,
          checkedAt: '2026-09-07',
          daysSinceChecked: 1,
          isStale: false,
          isConflicted: false,
          source: null,
        },
        contributions: [],
        loanStatus: null,
        stageHistory: [],
        priceLink: null,
        staleAfterDays: 30,
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplexRemodeling>)

    render(<ComplexRemodelingTab complexId="31" />)

    expect(screen.getByText('이주')).toBeInTheDocument()
    expect(screen.getByText('기존 1,620세대')).toBeInTheDocument()
    expect(screen.getByText('리모델링 후 정보 없음')).toBeInTheDocument()
    expect(screen.getByText('증가 정보 없음')).toBeInTheDocument()
    expect(screen.getByText('분담금 정보 없음')).toBeInTheDocument()
    expect(screen.getAllByText(/마지막 확인일 2026-09-07/).length).toBeGreaterThan(0)
    expect(screen.getByText(/출처 경인신문/)).toBeInTheDocument()
  })
})
