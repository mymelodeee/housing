import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceHistoryTable } from './PriceHistoryTable'
import type { PriceHistoryEntry } from '../types'

const entries: PriceHistoryEntry[] = [
  { transactionDate: '2019-01', transactionPrice: 70000, dataSource: '국토교통부' },
  { transactionDate: '2020-05', transactionPrice: 80000, dataSource: '실거래가 신고' },
  { transactionDate: '2021-09', transactionPrice: 88000, dataSource: '국토교통부' },
]

describe('PriceHistoryTable', () => {
  it('entries 개수만큼 행을 렌더링하고 각 행에 포맷팅된 값을 표시한다', () => {
    render(<PriceHistoryTable entries={entries} />)

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(entries.length + 1)

    expect(screen.getByText('2019-01')).toBeInTheDocument()
    expect(screen.getByText('70,000만원')).toBeInTheDocument()
    expect(screen.getByText('2020-05')).toBeInTheDocument()
    expect(screen.getByText('80,000만원')).toBeInTheDocument()
    expect(screen.getByText('실거래가 신고')).toBeInTheDocument()
    expect(screen.getByText('2021-09')).toBeInTheDocument()
    expect(screen.getByText('88,000만원')).toBeInTheDocument()
    expect(screen.getAllByText('국토교통부')).toHaveLength(2)
  })

  it('entries가 빈 배열이면 헤더 행만 렌더링되고 에러가 발생하지 않는다', () => {
    expect(() => render(<PriceHistoryTable entries={[]} />)).not.toThrow()

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(1)
  })

  it('showExclusiveArea가 false(기본값)면 평형 컬럼을 렌더링하지 않는다', () => {
    render(<PriceHistoryTable entries={entries} />)

    expect(screen.queryByRole('columnheader', { name: '평형' })).not.toBeInTheDocument()
  })

  it('showExclusiveArea가 true면 거래가와 데이터 출처 사이에 평형 컬럼을 렌더링한다', () => {
    const withArea: PriceHistoryEntry[] = [
      { transactionDate: '2021-09', transactionPrice: 88000, exclusiveArea: 84.98, dataSource: '국토교통부' },
    ]
    render(<PriceHistoryTable entries={withArea} showExclusiveArea />)

    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers).toEqual(['거래일자', '거래가', '평형', '데이터 출처']);
    expect(screen.getByText('84.98m² (25.7평)')).toBeInTheDocument()
  })

  it('showExclusiveArea가 true인데 exclusiveArea가 없으면 확인필요를 표시한다', () => {
    const withoutArea: PriceHistoryEntry[] = [{ transactionDate: '2021-09', transactionPrice: 88000, dataSource: '국토교통부' }]
    render(<PriceHistoryTable entries={withoutArea} showExclusiveArea />)

    expect(screen.getByText('확인필요')).toBeInTheDocument()
  })
})
