import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComplexLoanSimulationResult } from '../types'

export const complexLoanSimulationQueryKey = (complexId: string, salePrice?: number) =>
  ['complex-loan-simulation', complexId, salePrice ?? null] as const

export function useComplexLoanSimulation(complexId: string, salePrice?: number) {
  return useQuery({
    queryKey: complexLoanSimulationQueryKey(complexId, salePrice),
    queryFn: () => {
      const query = typeof salePrice === 'number' ? `?salePrice=${salePrice}` : ''
      return apiClient<ComplexLoanSimulationResult>(`/api/complexes/${complexId}/loan-simulation${query}`)
    },
    refetchOnMount: 'always',
  })
}
