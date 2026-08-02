import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComparisonSetSummary } from '../types'

export const comparisonSetsQueryKey = ['comparison-sets'] as const

export function useComparisonSets() {
  return useQuery({
    queryKey: comparisonSetsQueryKey,
    queryFn: () => apiClient<ComparisonSetSummary[]>('/api/comparison-sets'),
  })
}
