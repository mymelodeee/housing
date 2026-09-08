import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComplexPriceHistoryTab } from './ComplexPriceHistoryTab'
import { useComplexPriceHistory } from '../hooks/useComplexPriceHistory'

vi.mock('../hooks/useComplexPriceHistory', () => ({ useComplexPriceHistory: vi.fn() }))

const mockedUseComplexPriceHistory = vi.mocked(useComplexPriceHistory)

function mockResult(data: unknown) {
  return { data, isLoading: false, isError: false } as unknown as ReturnType<typeof useComplexPriceHistory>
}

describe('ComplexPriceHistoryTab', () => {
  it('평형이 여러 개면 필터를 표시하고 선택 시 해당 평형만 반영해 요약을 계산한다', async () => {
    const user = userEvent.setup()
    mockedUseComplexPriceHistory.mockReturnValue(
      mockResult({
        complexId: 1,
        lookupPeriodType: '최근 3년',
        firstTransactionMonth: null,
        entries: [
          { transactionDate: '2025-06-01', transactionPrice: 90000, exclusiveArea: 84.98, dataSource: 'x' },
          { transactionDate: '2025-06-10', transactionPrice: 60000, exclusiveArea: 59.95, dataSource: 'x' },
        ],
      })
    )

    const { container } = render(<ComplexPriceHistoryTab complexId="1" />)

    expect(screen.getByText('평형(전용면적)')).toBeInTheDocument()
    expect(screen.getByText('최근 실거래 월평균(2025-06)')).toBeInTheDocument()
    // 필터 미적용 시 두 평형(9억/6억) 평균 = 7억 5,000만원
    expect(container.textContent).toContain('7억 5,000만원')

    await user.selectOptions(screen.getByRole('combobox'), '84.98')

    // 84.98m²만 남으면 평균/최고가 모두 9억으로 수렴한다
    expect(container.textContent).toContain('9억')
    expect(container.textContent).not.toContain('7억 5,000만원')
  })

  it('평형 정보가 없으면 필터를 표시하지 않는다', () => {
    mockedUseComplexPriceHistory.mockReturnValue(
      mockResult({
        complexId: 1,
        lookupPeriodType: '최근 3년',
        firstTransactionMonth: null,
        entries: [{ transactionDate: '2025-06-01', transactionPrice: 90000, dataSource: 'x' }],
      })
    )

    render(<ComplexPriceHistoryTab complexId="1" />)

    expect(screen.queryByText('평형(전용면적)')).not.toBeInTheDocument()
  })

  it('전년 동월 거래가 있으면 전년동월대비 거래량 변화율을 표시한다', () => {
    mockedUseComplexPriceHistory.mockReturnValue(
      mockResult({
        complexId: 1,
        lookupPeriodType: '최근 3년',
        firstTransactionMonth: null,
        entries: [
          { transactionDate: '2024-06-01', transactionPrice: 80000, dataSource: 'x' },
          { transactionDate: '2025-06-01', transactionPrice: 90000, dataSource: 'x' },
          { transactionDate: '2025-06-10', transactionPrice: 92000, dataSource: 'x' },
        ],
      })
    )

    const { container } = render(<ComplexPriceHistoryTab complexId="1" />)

    expect(container.textContent).toContain('전년동월대비 ▲ 100%')
  })

  it('실거래 이력이 없으면 안내 문구를 표시한다', () => {
    mockedUseComplexPriceHistory.mockReturnValue(
      mockResult({ complexId: 1, lookupPeriodType: '실거래 이력 없음', firstTransactionMonth: null, entries: [] })
    )

    render(<ComplexPriceHistoryTab complexId="1" />)

    expect(screen.getByText('실거래 이력 없음')).toBeInTheDocument()
  })
})
