import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RemodelingTab } from './RemodelingTab'
import { useListingRemodeling } from '../hooks/useListingRemodeling'
import type { RemodelingResponse } from '../types'

vi.mock('../hooks/useListingRemodeling', () => ({
  useListingRemodeling: vi.fn(),
}))

const mockedUseListingRemodeling = vi.mocked(useListingRemodeling)

const source = {
  name: '용인시 고시',
  url: 'https://example.com/notice',
  sourceDate: '2025-11-18',
  reliability: 'high' as const,
}

const projectData = {
  listingId: 12,
  complexId: 5,
  hasProject: true,
  projectName: '○○아파트 리모델링주택조합',
  complexName: '○○아파트',
  currentStage: {
    value: '사업계획승인',
    status: 'confirmed',
    effectiveDate: '2025-11-18',
    checkedAt: '2026-09-07',
    daysSinceChecked: 0,
    isStale: false,
    isConflicted: false,
    source,
  },
  households: {
    before: 1234,
    after: 1418,
    increase: 184,
    status: 'confirmed',
    effectiveDate: '2025-11-18',
    checkedAt: '2026-09-07',
    daysSinceChecked: 0,
    isStale: false,
    source,
  },
  contributions: [
    {
      unitType: '84A',
      amount: 25000,
      unit: '만원',
      status: 'estimated',
      effectiveDate: '2026-03-01',
      checkedAt: '2026-09-07',
      daysSinceChecked: 0,
      isStale: false,
      isConflicted: false,
      source,
    },
  ],
  loanStatus: {
    value: '이주비 대출 미확정',
    status: 'unknown',
    effectiveDate: null,
    checkedAt: '2026-09-07',
    daysSinceChecked: 0,
    isStale: false,
    source: null,
  },
  stageHistory: [
    {
      stage: '조합설립인가',
      effectiveDate: '2021-06-30',
      status: 'confirmed',
      checkedAt: '2026-09-07',
      source,
    },
  ],
  priceLink: {
    recentTransactionPrice: 118000,
    recentTransactionDate: '2026-08-20',
    estimatedTotalCost: 143000,
    note: '실거래가는 매매가 변동 이력 탭 기준',
  },
  staleAfterDays: 30,
} satisfies RemodelingResponse

function mockResult(value: Partial<ReturnType<typeof useListingRemodeling>>) {
  mockedUseListingRemodeling.mockReturnValue(value as ReturnType<typeof useListingRemodeling>)
}

describe('RemodelingTab', () => {
  beforeEach(() => {
    mockedUseListingRemodeling.mockReset()
  })

  it('로딩 중일 때 불러오는 중 텍스트를 표시한다', () => {
    mockResult({ isLoading: true, isError: false, data: undefined })

    render(<RemodelingTab listingId="12" />)

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러일 때 alert role을 표시하고 에러를 던지지 않는다', () => {
    mockResult({ isLoading: false, isError: true, data: undefined })

    expect(() => render(<RemodelingTab listingId="12" />)).not.toThrow()
    expect(screen.getByRole('alert')).toHaveTextContent('리모델링 정보를 불러오지 못했습니다.')
  })

  it('리모델링 추진 정보가 없으면 안내 문구만 표시한다', () => {
    mockResult({
      isLoading: false,
      isError: false,
      data: {
        listingId: 12,
        complexId: 5,
        hasProject: false,
        message: '리모델링 추진 정보 없음',
      },
    })

    render(<RemodelingTab listingId="12" />)

    expect(screen.getByText('리모델링 추진 정보 없음')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('정상 데이터에서 단계·세대수·분담금·마지막 확인일·출처를 렌더링한다', () => {
    mockResult({ isLoading: false, isError: false, data: projectData })

    render(<RemodelingTab listingId="12" />)

    expect(screen.getByText('사업계획승인')).toBeInTheDocument()
    expect(screen.getByText('조합설립인가')).toBeInTheDocument()
    expect(screen.getByText('1,234세대 → 1,418세대 (+184)')).toBeInTheDocument()
    expect(screen.getByText('84A')).toBeInTheDocument()
    expect(screen.getByText('2억 5,000만원')).toBeInTheDocument()
    expect(screen.getByText('이주비 대출 미확정')).toBeInTheDocument()
    expect(screen.getAllByText(/마지막 확인일 2026-09-07/).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: '용인시 고시' }).length).toBeGreaterThan(0)
    expect(
      screen.getByText('최근 실거래가 11억 8,000만원 + 분담금 2억 5,000만원 = 총 부담 추정 14억 3,000만원'),
    ).toBeInTheDocument()
    expect(screen.getByText('실거래가는 매매가 변동 이력 탭 기준')).toBeInTheDocument()
  })

  it('isStale/isConflicted인 항목에 확인 필요·출처 충돌을 표시한다', () => {
    mockResult({
      isLoading: false,
      isError: false,
      data: {
        ...projectData,
        currentStage: { ...projectData.currentStage, isStale: true, isConflicted: true },
      } satisfies RemodelingResponse,
    })

    render(<RemodelingTab listingId="12" />)

    expect(screen.getByText('확인 필요')).toBeInTheDocument()
    expect(screen.getByText('출처 충돌')).toBeInTheDocument()
  })
})
