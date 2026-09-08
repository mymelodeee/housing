import { describe, it, expect } from 'vitest'
import { buildMonthlyAverageSeries, findYearAgoPoint } from './monthlySeries'

describe('buildMonthlyAverageSeries', () => {
  it('entries가 없으면 빈 배열을 반환한다', () => {
    expect(buildMonthlyAverageSeries([])).toEqual([])
  })

  it('같은 달 거래 여러 건은 평균으로 합쳐지고 거래 건수를 함께 기록한다', () => {
    const result = buildMonthlyAverageSeries([
      { transactionDate: '2024-01-05', value: 90000 },
      { transactionDate: '2024-01-20', value: 100000 },
    ])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ month: '2024-01', value: 95000, isCarried: false, count: 2 })
    expect(result[0].transactions.map((t) => t.date)).toEqual(['2024-01-05', '2024-01-20'])
  })

  it('거래가 없는 달은 직전 달의 평균값을 그대로 이어 붙인다', () => {
    const result = buildMonthlyAverageSeries([
      { transactionDate: '2024-01-10', value: 90000 },
      { transactionDate: '2024-04-10', value: 100000 },
    ])

    expect(result.map((p) => p.month)).toEqual(['2024-01', '2024-02', '2024-03', '2024-04'])
    expect(result[1]).toMatchObject({ value: 90000, isCarried: true, count: 0 })
    expect(result[2]).toMatchObject({ value: 90000, isCarried: true, count: 0 })
    expect(result[3]).toMatchObject({ value: 100000, isCarried: false, count: 1 })
  })

  it('연도 경계를 넘는 공백도 정확히 채운다', () => {
    const result = buildMonthlyAverageSeries([
      { transactionDate: '2023-11-01', value: 50000 },
      { transactionDate: '2024-02-01', value: 55000 },
    ])

    expect(result.map((p) => p.month)).toEqual(['2023-11', '2023-12', '2024-01', '2024-02'])
  })

  it('거래가 하나뿐이면 해당 월 1개 포인트만 반환한다', () => {
    const result = buildMonthlyAverageSeries([{ transactionDate: '2024-06-01', value: 70000 }])
    expect(result).toEqual([
      { month: '2024-06', value: 70000, isCarried: false, count: 1, transactions: [{ date: '2024-06-01', value: 70000 }] },
    ])
  })
})

describe('findYearAgoPoint', () => {
  it('같은 월의 1년 전 포인트를 찾는다', () => {
    const points = buildMonthlyAverageSeries([
      { transactionDate: '2023-06-01', value: 50000 },
      { transactionDate: '2024-06-01', value: 70000 },
    ])

    expect(findYearAgoPoint(points, '2024-06')).toMatchObject({ month: '2023-06', value: 50000 })
  })

  it('1년 전 데이터가 없으면 undefined를 반환한다', () => {
    const points = buildMonthlyAverageSeries([{ transactionDate: '2024-06-01', value: 70000 }])

    expect(findYearAgoPoint(points, '2024-06')).toBeUndefined()
  })
})
