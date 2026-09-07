export interface MonthlySeriesTransaction {
  date: string
  value: number
}

export interface MonthlySeriesPoint {
  month: string
  value: number
  isCarried: boolean
  count: number
  transactions: MonthlySeriesTransaction[]
}

interface SourceEntry {
  transactionDate: string
  value: number
}

function addMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number)
  const nextMon = mon === 12 ? 1 : mon + 1
  const nextYear = mon === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMon).padStart(2, '0')}`
}

// 월별 평균가를 계산하고, 거래가 없는 달은 직전 달의 값을 그대로 이어 붙인다(거래 공백 구간을 수평선으로 표현).
export function buildMonthlyAverageSeries(entries: SourceEntry[]): MonthlySeriesPoint[] {
  if (entries.length === 0) return []

  const byMonth = new Map<string, MonthlySeriesTransaction[]>()
  for (const entry of entries) {
    const month = entry.transactionDate.slice(0, 7)
    const list = byMonth.get(month) ?? []
    list.push({ date: entry.transactionDate, value: entry.value })
    byMonth.set(month, list)
  }

  const months = [...byMonth.keys()].sort()
  const firstMonth = months[0]
  const lastMonth = months[months.length - 1]

  const points: MonthlySeriesPoint[] = []
  let carriedValue = 0
  for (let month = firstMonth; ; month = addMonth(month)) {
    const transactions = (byMonth.get(month) ?? []).sort((a, b) => (a.date < b.date ? -1 : 1))

    if (transactions.length > 0) {
      carriedValue = transactions.reduce((sum, t) => sum + t.value, 0) / transactions.length
      points.push({ month, value: carriedValue, isCarried: false, count: transactions.length, transactions })
    } else {
      points.push({ month, value: carriedValue, isCarried: true, count: 0, transactions: [] })
    }

    if (month === lastMonth) break
  }

  return points
}
