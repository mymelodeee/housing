import type { RegionalTransaction } from '../types'

export interface RecentTransactionGroup {
  key: string
  complexName: string
  address: string | null
  householdCount: number | null
  minSalePrice: number
  maxSalePrice: number
  entries: RegionalTransaction[]
}

export function groupRecentTransactionsByComplex(entries: RegionalTransaction[]): RecentTransactionGroup[] {
  const groups = new Map<string, RecentTransactionGroup>()

  for (const entry of entries) {
    const key = `${entry.lawdCd}-${entry.complexName}`
    const existing = groups.get(key)

    if (existing) {
      existing.entries.push(entry)
      existing.minSalePrice = Math.min(existing.minSalePrice, entry.salePrice)
      existing.maxSalePrice = Math.max(existing.maxSalePrice, entry.salePrice)
      if (existing.address === null && entry.address !== null) existing.address = entry.address
      if (existing.householdCount === null && entry.householdCount !== null) {
        existing.householdCount = entry.householdCount
      }
      continue
    }

    groups.set(key, {
      key,
      complexName: entry.complexName,
      address: entry.address,
      householdCount: entry.householdCount,
      minSalePrice: entry.salePrice,
      maxSalePrice: entry.salePrice,
      entries: [entry],
    })
  }

  return Array.from(groups.values())
}
