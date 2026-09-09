import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ApartmentComplexSummary } from '../../../shared/types/listing'

export const allComplexesQueryKey = ['complexes', 'all'] as const

export function useAllComplexes() {
  return useQuery({
    queryKey: allComplexesQueryKey,
    queryFn: () => apiClient<ApartmentComplexSummary[]>('/api/complexes'),
  })
}
