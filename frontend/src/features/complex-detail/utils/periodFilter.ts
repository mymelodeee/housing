export type Period = '1y' | '3y' | 'all'

function cutoffMonth(period: Period, now: Date): string | null {
  if (period === 'all') return null
  const years = period === '1y' ? 1 : 3
  const year = now.getFullYear() - years
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function filterByPeriod<T>(entries: T[], period: Period, getMonth: (entry: T) => string, now = new Date()): T[] {
  const cutoff = cutoffMonth(period, now)
  if (cutoff === null) return entries
  return entries.filter((entry) => getMonth(entry) >= cutoff)
}
