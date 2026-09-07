import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceHistoryTab } from './PriceHistoryTab'
import { useListingPriceHistory } from '../hooks/useListingPriceHistory'
import { useListing } from '../../hooks/useListing'
import type { PriceHistoryEntry } from '../types'

vi.mock('../hooks/useListingPriceHistory', () => ({
  useListingPriceHistory: vi.fn(),
}))
vi.mock('../../hooks/useListing', () => ({
  useListing: vi.fn(),
}))

const mockedUseListingPriceHistory = vi.mocked(useListingPriceHistory)
const mockedUseListing = vi.mocked(useListing)

const sampleEntries: PriceHistoryEntry[] = [
  { transactionDate: '2019-01-10', transactionPrice: 70000, dataSource: '국토교통부' },
  { transactionDate: '2020-05-10', transactionPrice: 80000, dataSource: '국토교통부' },
]

describe('PriceHistoryTab', () => {
  beforeEach(() => {
    mockedUseListingPriceHistory.mockReset()
    mockedUseListing.mockReset()
    mockedUseListing.mockReturnValue({ data: undefined } as ReturnType<typeof useListing>)
  })

  it('로딩 중일 때 불러오는 중 텍스트를 표시한다', () => {
    mockedUseListingPriceHistory.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useListingPriceHistory>)

    render(<PriceHistoryTab listingId="1" />)

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러일 때 alert role을 표시하고 에러를 던지지 않는다', () => {
    mockedUseListingPriceHistory.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as ReturnType<typeof useListingPriceHistory>)

    expect(() => render(<PriceHistoryTab listingId="1" />)).not.toThrow()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('실거래 이력 없음 케이스(시나리오 7-3)를 올바르게 표시한다', () => {
    mockedUseListingPriceHistory.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        listingId: 1,
        complexId: 10,
        lookupPeriodType: '실거래 이력 없음',
        firstTransactionMonth: null,
        entries: [],
      },
    } as unknown as ReturnType<typeof useListingPriceHistory>)

    const { container } = render(<PriceHistoryTab listingId="1" />)

    expect(screen.getByText('실거래 이력 없음')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-testid="price-point"]')).toHaveLength(0)
    expect(container.querySelector('table')).toBeNull()
  })

  it('최근 20년 케이스(시나리오 7-1)에서 차트와 표, 월평균 요약을 렌더링하고 안내 문구는 표시하지 않는다', () => {
    mockedUseListingPriceHistory.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        listingId: 1,
        complexId: 10,
        lookupPeriodType: '최근 20년',
        firstTransactionMonth: null,
        entries: sampleEntries,
      },
    } as ReturnType<typeof useListingPriceHistory>)

    const { container } = render(<PriceHistoryTab listingId="1" />)

    expect(screen.getAllByRole('row')).toHaveLength(sampleEntries.length + 1)
    expect(screen.queryByText(/이후 데이터/)).not.toBeInTheDocument()
    expect(container.querySelector('.price-history-tab__summary-value')).toHaveTextContent('8억')
  })

  it('최초거래 이후 케이스(시나리오 7-2)에서 안내 문구와 차트/표를 함께 렌더링한다', () => {
    mockedUseListingPriceHistory.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        listingId: 1,
        complexId: 10,
        lookupPeriodType: '최초거래 이후',
        firstTransactionMonth: '2018-03',
        entries: sampleEntries,
      },
    } as ReturnType<typeof useListingPriceHistory>)

    render(<PriceHistoryTab listingId="1" />)

    expect(screen.getByText('최초거래(2018-03) 이후 데이터')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(sampleEntries.length + 1)
  })

  it('현재 호가가 있으면 호가 대비 등락 pill이 표시된다', () => {
    mockedUseListing.mockReturnValue({ data: { salePrice: 100000 } } as ReturnType<typeof useListing>)
    mockedUseListingPriceHistory.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        listingId: 1,
        complexId: 10,
        lookupPeriodType: '최근 20년',
        firstTransactionMonth: null,
        entries: sampleEntries,
      },
    } as ReturnType<typeof useListingPriceHistory>)

    const { container } = render(<PriceHistoryTab listingId="1" />)
    expect(container.querySelector('[class*="diff-pill"]')).toHaveTextContent('호가 대비')
  })
})
