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
})
