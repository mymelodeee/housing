import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JeonseHistoryTab } from './JeonseHistoryTab'
import { useListingJeonseHistory } from '../hooks/useListingJeonseHistory'
import type { JeonseHistoryResponse } from '../types'

vi.mock('../hooks/useListingJeonseHistory', () => ({
  useListingJeonseHistory: vi.fn(),
}))

const mockedHook = vi.mocked(useListingJeonseHistory)

function mockResult(overrides: Partial<ReturnType<typeof useListingJeonseHistory>>) {
  return { data: undefined, isLoading: false, isError: false, ...overrides } as ReturnType<
    typeof useListingJeonseHistory
  >
}

const sampleData: JeonseHistoryResponse = {
  listingId: 12,
  complexId: 8,
  saleEntries: [
    { transactionDate: '2026-06-10', transactionPrice: 100000, dataSource: '매매출처' },
    { transactionDate: '2026-07-10', transactionPrice: 110000, dataSource: '매매출처' },
  ],
  jeonseEntries: [
    { transactionDate: '2026-06-15', deposit: 60000, dataSource: '전세출처' },
    { transactionDate: '2026-07-20', deposit: 66000, dataSource: '전세출처' },
  ],
  ratioEntries: [
    { month: '2026-06', jeonseRatioPercent: 60 },
    { month: '2026-07', jeonseRatioPercent: 60 },
  ],
  lookupWindowNote: '실시간 연동 특성상 최근 3년(36개월) 범위만 조회합니다',
}

describe('JeonseHistoryTab', () => {
  beforeEach(() => {
    mockedHook.mockReset()
  })

  it('로딩 중이면 불러오는 중...을 표시한다', () => {
    mockedHook.mockReturnValue(mockResult({ isLoading: true }))
    render(<JeonseHistoryTab listingId="12" />)
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러이면 role=alert 메시지를 표시한다', () => {
    mockedHook.mockReturnValue(mockResult({ isError: true }))
    render(<JeonseHistoryTab listingId="12" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('매매·전세 이력이 모두 없으면 실거래 이력 없음을 표시한다', () => {
    mockedHook.mockReturnValue(
      mockResult({ data: { ...sampleData, saleEntries: [], jeonseEntries: [], ratioEntries: [] } }),
    )
    render(<JeonseHistoryTab listingId="12" />)
    expect(screen.getByText('실거래 이력 없음')).toBeInTheDocument()
  })

  it('데이터가 있으면 범례(매매가/전세가/전세가율)와 그래프, 전세 거래 테이블(내림차순)을 렌더링한다', () => {
    mockedHook.mockReturnValue(mockResult({ data: sampleData }))
    render(<JeonseHistoryTab listingId="12" />)

    expect(screen.getByText('매매가')).toBeInTheDocument()
    expect(screen.getAllByText('전세가').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('전세가율(우측)')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '매매가·전세가·전세가율 변동 그래프' })).toBeInTheDocument()

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('2026-07-20')
    expect(rows[1]).toHaveTextContent('2026-06-15')
    expect(rows[0]).toHaveTextContent('66,000만원')
  })

  it('그래프에 연/월 형식의 x축 날짜 라벨이 표시된다', () => {
    mockedHook.mockReturnValue(mockResult({ data: sampleData }))
    const { container } = render(<JeonseHistoryTab listingId="12" />)

    const svg = container.querySelector('svg')
    const labels = Array.from(svg?.querySelectorAll('text') ?? []).map((el) => el.textContent)
    expect(labels.some((text) => /^\d{4}-\d{2}$/.test(text ?? ''))).toBe(true)
  })

  it('전세 이력만 없으면 안내 문구를 표시하되 매매가 그래프는 유지한다', () => {
    mockedHook.mockReturnValue(mockResult({ data: { ...sampleData, jeonseEntries: [], ratioEntries: [] } }))
    render(<JeonseHistoryTab listingId="12" />)

    expect(screen.getByText(/전세 실거래 이력 없음/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '매매가·전세가·전세가율 변동 그래프' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
