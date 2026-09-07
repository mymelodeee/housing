import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { RegionalTransaction } from '../types'

export const recentTransactionsQueryKey = (minPrice: number, maxPrice: number, city = '') =>
  ['recent-transactions', { minPrice, maxPrice, city }] as const

export function useRecentTransactions(minPrice: number, maxPrice: number, enabled: boolean, city = '') {
  return useQuery({
    queryKey: recentTransactionsQueryKey(minPrice, maxPrice, city),
    queryFn: () => {
      const cityParam = city ? `&city=${encodeURIComponent(city)}` : ''
      return apiClient<RegionalTransaction[]>(`/api/listings/market-search?minPrice=${minPrice}&maxPrice=${maxPrice}${cityParam}`)
    },
    enabled,
  })
}
