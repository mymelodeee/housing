import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComplexRemodelingResponse } from '../types'

export const complexRemodelingQueryKey = (complexId: string) => ['complex-remodeling', complexId] as const

export function useComplexRemodeling(complexId: string) {
  return useQuery({
    queryKey: complexRemodelingQueryKey(complexId),
    queryFn: () => apiClient<ComplexRemodelingResponse>(`/api/complexes/${complexId}/remodeling`),
  })
}
