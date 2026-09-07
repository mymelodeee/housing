import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComplexRegulationInfo } from '../types'

export const complexRegulationQueryKey = (complexId: string, salePrice?: number) =>
  ['complex-regulation', complexId, salePrice ?? null] as const

export function useComplexRegulation(complexId: string, salePrice?: number) {
  return useQuery({
    queryKey: complexRegulationQueryKey(complexId, salePrice),
    queryFn: () => {
      const query = typeof salePrice === 'number' ? `?salePrice=${salePrice}` : ''
      return apiClient<ComplexRegulationInfo>(`/api/complexes/${complexId}/regulation${query}`)
    },
  })
}
