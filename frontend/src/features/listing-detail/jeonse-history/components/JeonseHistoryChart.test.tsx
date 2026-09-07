import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { JeonseHistoryChart } from './JeonseHistoryChart'

describe('JeonseHistoryChart', () => {
  it('반올림된 축 눈금 값이 같아도 duplicate key warning을 출력하지 않는다', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <JeonseHistoryChart
        saleEntries={[
          { transactionDate: '2025-01-10', transactionPrice: 95000, dataSource: '국토교통부' },
          { transactionDate: '2025-02-10', transactionPrice: 95001, dataSource: '국토교통부' },
        ]}
        jeonseEntries={[
          { transactionDate: '2025-01-10', deposit: 60000, dataSource: '국토교통부' },
          { transactionDate: '2025-02-10', deposit: 60001, dataSource: '국토교통부' },
        ]}
        ratioEntries={[
          { month: '2025-01', jeonseRatioPercent: 70 },
          { month: '2025-02', jeonseRatioPercent: 70.01 },
        ]}
      />,
    )

    const duplicateKeyWarnings = consoleError.mock.calls.filter(([message]) =>
      String(message).includes('same key'),
    )
    expect(duplicateKeyWarnings).toHaveLength(0)

    consoleError.mockRestore()
  })

  it('거래가 없는 달은 직전 평균값을 이어받은 point로 표시된다', () => {
    const { container } = render(
      <JeonseHistoryChart
        saleEntries={[
          { transactionDate: '2024-01-10', transactionPrice: 90000, dataSource: '국토교통부' },
          { transactionDate: '2024-04-10', transactionPrice: 100000, dataSource: '국토교통부' },
        ]}
        jeonseEntries={[]}
        ratioEntries={[]}
      />,
    )

    const points = container.querySelectorAll('[data-testid="jeonse-history-chart__sale-point"]')
    expect(points).toHaveLength(4)
    expect(points[0].getAttribute('class')).not.toContain('carried')
    expect(points[1].getAttribute('class')).toContain('carried')
    expect(points[2].getAttribute('class')).toContain('carried')
    expect(points[3].getAttribute('class')).not.toContain('carried')
  })

  it('point를 클릭하면 해당 월의 매매/전세/전세가율 상세가 표시된다', () => {
    const { container } = render(
      <JeonseHistoryChart
        saleEntries={[{ transactionDate: '2024-01-10', transactionPrice: 90000, dataSource: '국토교통부' }]}
        jeonseEntries={[{ transactionDate: '2024-01-15', deposit: 60000, dataSource: '국토교통부' }]}
        ratioEntries={[{ month: '2024-01', jeonseRatioPercent: 67 }]}
      />,
    )

    const salePoint = container.querySelector('[data-testid="jeonse-history-chart__sale-point"]')
    fireEvent.click(salePoint!)

    const detail = container.querySelector('.jeonse-history-chart__detail')
    expect(detail).toHaveTextContent('2024-01')
    expect(detail).toHaveTextContent('매매 평균 90,000만원')
    expect(detail).toHaveTextContent('전세 평균 60,000만원')
    expect(detail).toHaveTextContent('전세가율 67%')
  })

  it('askingPrice가 주어지면 현재 호가 기준선이 렌더링된다', () => {
    const { container } = render(
      <JeonseHistoryChart
        saleEntries={[{ transactionDate: '2024-01-10', transactionPrice: 90000, dataSource: '국토교통부' }]}
        jeonseEntries={[]}
        ratioEntries={[]}
        askingPrice={100000}
      />,
    )

    expect(container.querySelector('.jeonse-history-chart__asking-line')).toBeInTheDocument()
    expect(screen.getByText('현재 호가')).toBeInTheDocument()
  })

  it('전세가율 데이터가 있으면 평균 전세가율 안내가 표시된다', () => {
    render(
      <JeonseHistoryChart
        saleEntries={[]}
        jeonseEntries={[]}
        ratioEntries={[
          { month: '2024-01', jeonseRatioPercent: 60 },
          { month: '2024-02', jeonseRatioPercent: 70 },
        ]}
      />,
    )

    expect(screen.getByText('평균 전세가율 65%')).toBeInTheDocument()
  })
})
