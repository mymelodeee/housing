import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PriceHistoryChart } from './PriceHistoryChart'
import type { PriceHistoryEntry } from '../types'

const entries: PriceHistoryEntry[] = [
  { transactionDate: '2019-01-10', transactionPrice: 70000, dataSource: '국토교통부' },
  { transactionDate: '2019-04-05', transactionPrice: 80000, dataSource: '국토교통부' },
  { transactionDate: '2019-04-20', transactionPrice: 90000, dataSource: '국토교통부' },
]

describe('PriceHistoryChart', () => {
  it('월별로 그룹핑되어 거래가 없는 달은 직전 값을 이어받은 point가 함께 렌더링된다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} />)

    const points = container.querySelectorAll('[data-testid="price-point"]')
    // 2019-01(실거래), 2019-02(공백/이어짐), 2019-03(공백/이어짐), 2019-04(실거래 평균)
    expect(points).toHaveLength(4)
    expect(points[1].getAttribute('data-carried')).toBe('true')
    expect(points[2].getAttribute('data-carried')).toBe('true')
    expect(points[3].getAttribute('data-carried')).toBe('false')
  })

  it('같은 달 거래는 평균으로 합쳐 마지막 라벨에 표시된다', () => {
    render(<PriceHistoryChart entries={entries} />)
    // 2019-04 평균 = (80,000 + 90,000) / 2 = 85,000
    expect(screen.getAllByText('85,000만원').length).toBeGreaterThan(0)
  })

  it('x축에 연/월 형식의 날짜 라벨이 표시된다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} />)
    const svg = container.querySelector('svg')
    const labels = Array.from(svg?.querySelectorAll('text') ?? []).map((el) => el.textContent)
    expect(labels).toEqual(expect.arrayContaining(['2019-01', '2019-04']))
  })

  it('entries가 1개일 때 point 1개만 렌더링되고 polyline은 없으며 에러가 발생하지 않는다', () => {
    const single: PriceHistoryEntry[] = [{ transactionDate: '2022-11-01', transactionPrice: 95000, dataSource: '국토교통부' }]

    let container: HTMLElement
    expect(() => {
      ;({ container } = render(<PriceHistoryChart entries={single} />))
    }).not.toThrow()

    expect(container!.querySelectorAll('[data-testid="price-point"]')).toHaveLength(1)
    const polyline = container!.querySelector('polyline')
    expect(polyline === null || (polyline.getAttribute('points') ?? '').trim() === '').toBe(true)
  })

  it('point에 마우스를 올리면 툴팁이 표시되고, 벗어나면 사라진다', async () => {
    const user = userEvent.setup()
    const { container } = render(<PriceHistoryChart entries={entries} />)

    const points = container.querySelectorAll('[data-testid="price-point"]')
    await user.hover(points[0])
    expect(container.querySelector('.price-history-chart__hover-tooltip')).toHaveTextContent(/2019-01.*70,000만원/)

    await user.unhover(points[0])
    expect(container.querySelector('.price-history-chart__hover-tooltip')).not.toBeInTheDocument()
  })

  it('point를 클릭하면 상세 패널이 열리고 다시 클릭하면 닫힌다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} />)
    const points = container.querySelectorAll('[data-testid="price-point"]')

    fireEvent.click(points[3])
    expect(container.querySelector('.price-history-chart__detail')).toHaveTextContent('2019-04')
    expect(container.querySelector('.price-history-chart__detail')).toHaveTextContent('2019-04-05')
    expect(container.querySelector('.price-history-chart__detail')).toHaveTextContent('2019-04-20')

    fireEvent.click(points[3])
    expect(container.querySelector('.price-history-chart__detail')).not.toBeInTheDocument()
  })

  it('공백(carried) point를 클릭하면 거래 없음 안내가 표시된다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} />)
    const points = container.querySelectorAll('[data-testid="price-point"]')

    fireEvent.click(points[1])
    expect(container.querySelector('.price-history-chart__detail')).toHaveTextContent('이번 달 거래 없음')
  })

  it('askingPrice가 주어지면 현재 호가 기준선이 렌더링된다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} askingPrice={100000} />)
    expect(container.querySelector('.price-history-chart__asking-line')).toBeInTheDocument()
    expect(screen.getByText('현재 호가')).toBeInTheDocument()
  })

  it('askingPrice가 없으면 호가 기준선이 렌더링되지 않는다', () => {
    const { container } = render(<PriceHistoryChart entries={entries} />)
    expect(container.querySelector('.price-history-chart__asking-line')).not.toBeInTheDocument()
  })
})
