import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComplexPriceHistoryResponse } from '../types'

export const complexPriceHistoryQueryKey = (complexId: string) => ['complex-price-history', complexId] as const

export function useComplexPriceHistory(complexId: string) {
  return useQuery({
    queryKey: complexPriceHistoryQueryKey(complexId),
    queryFn: () => apiClient<ComplexPriceHistoryResponse>(`/api/complexes/${complexId}/price-history`),
  })
}
