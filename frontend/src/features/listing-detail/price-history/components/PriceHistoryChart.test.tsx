import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PriceHistoryChart } from './PriceHistoryChart'
import type { PriceHistoryEntry } from '../types'

const entries: PriceHistoryEntry[] = [
  { transactionDate: '2019-01', transactionPrice: 70000, dataSource: '국토교통부' },
  { transactionDate: '2020-05', transactionPrice: 80000, dataSource: '국토교통부' },
  { transactionDate: '2021-09', transactionPrice: 88000, dataSource: '국토교통부' },
  { transactionDate: '2022-11', transactionPrice: 95000, dataSource: '국토교통부' },
]

describe('PriceHistoryChart', () => {
  it('entries 개수만큼 price-point circle을 렌더링한다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} />)

    const points = container.querySelectorAll('[data-testid="price-point"]')
    expect(points).toHaveLength(4)
  })

  it('entries가 2개 이상이면 polyline을 렌더링하고 좌표 쌍 개수가 일치한다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} />)

    const polyline = container.querySelector('polyline')
    expect(polyline).not.toBeNull()

    const tokens = (polyline?.getAttribute('points') ?? '').trim().split(/\s+/).filter(Boolean)
    expect(tokens).toHaveLength(4)
  })

  it('마지막 시점의 가격이 라벨로 표시된다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} />)

    const matches = screen.getAllByText('95,000만원')
    expect(matches.length).toBeGreaterThan(0)
    expect(container.querySelector('.price-history-chart__end-label')?.textContent).toContain('95,000만원')
  })

  it('entries가 1개일 때 circle 1개만 렌더링되고 polyline은 없으며 에러가 발생하지 않는다', () => {
    const single: PriceHistoryEntry[] = [
      { transactionDate: '2022-11', transactionPrice: 95000, dataSource: '국토교통부' },
    ]

    let container: HTMLElement
    expect(() => {
      ;({ container } = render(<PriceHistoryChart entries={single} />))
    }).not.toThrow()

    const points = container!.querySelectorAll('[data-testid="price-point"]')
    expect(points).toHaveLength(1)

    const polyline = container!.querySelector('polyline')
    expect(polyline === null || (polyline.getAttribute('points') ?? '').trim() === '').toBe(true)
  })

  it('point에 마우스를 올리면 툴팁이 표시되고, 벗어나면 사라진다', async () => {
    const user = userEvent.setup()
    const { container } = render(<PriceHistoryChart entries={entries} />)

    const points = container.querySelectorAll('[data-testid="price-point"]')
    const target = points[1]

    await user.hover(target)
    expect(screen.getByText(/2020-05/)).toBeInTheDocument()
    expect(screen.getByText(/80,000만원/)).toBeInTheDocument()

    await user.unhover(target)
    expect(screen.queryByText(/2020-05/)).not.toBeInTheDocument()
  })

  it('point에 focus하면 툴팁이 표시되고, blur하면 사라진다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} />)

    const points = container.querySelectorAll('[data-testid="price-point"]')
    const target = points[2]

    fireEvent.focus(target)
    expect(screen.getByText(/2021-09/)).toBeInTheDocument()
    expect(screen.getByText(/88,000만원/)).toBeInTheDocument()

    fireEvent.blur(target)
    expect(screen.queryByText(/2021-09/)).not.toBeInTheDocument()
  })
})
