import { describe, it, expect } from 'vitest'
import { filterByPeriod } from './periodFilter'

const now = new Date(2026, 8, 8) // 2026-09-08

describe('filterByPeriod', () => {
  it('all이면 전체를 그대로 반환한다', () => {
    const entries = [{ month: '2020-01' }, { month: '2026-09' }]
    expect(filterByPeriod(entries, 'all', (e) => e.month, now)).toEqual(entries)
  })

  it('1y면 최근 1년(같은 월 포함) 이내만 남긴다', () => {
    const entries = [{ month: '2025-08' }, { month: '2025-09' }, { month: '2026-01' }, { month: '2026-09' }]
    expect(filterByPeriod(entries, '1y', (e) => e.month, now)).toEqual([
      { month: '2025-09' },
      { month: '2026-01' },
      { month: '2026-09' },
    ])
  })

  it('3y면 최근 3년 이내만 남긴다', () => {
    const entries = [{ month: '2023-08' }, { month: '2023-09' }, { month: '2025-01' }]
    expect(filterByPeriod(entries, '3y', (e) => e.month, now)).toEqual([{ month: '2023-09' }, { month: '2025-01' }])
  })

  it('transactionDate(YYYY-MM-DD) 형태에서도 월 단위로 정확히 필터링한다', () => {
    const entries = [{ transactionDate: '2025-09-01' }, { transactionDate: '2025-08-31' }]
    expect(filterByPeriod(entries, '1y', (e) => e.transactionDate.slice(0, 7), now)).toEqual([
      { transactionDate: '2025-09-01' },
    ])
  })
})
