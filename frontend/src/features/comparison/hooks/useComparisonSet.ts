import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComparisonSetDetail } from '../types'

export const comparisonSetQueryKey = (id: string) => ['comparison-sets', id] as const

export function useComparisonSet(id: string) {
  return useQuery({
    queryKey: comparisonSetQueryKey(id),
    queryFn: () => apiClient<ComparisonSetDetail>(`/api/comparison-sets/${id}`),
  })
}
