import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { LoanSimulationResult } from '../types'

export const loanSimulationQueryKey = (listingId: string) => ['listing-loan-simulation', listingId] as const

export function useListingLoanSimulation(listingId: string) {
  return useQuery({
    queryKey: loanSimulationQueryKey(listingId),
    queryFn: () => apiClient<LoanSimulationResult>(`/api/listings/${listingId}/loan-simulation`),
    refetchOnMount: 'always',
  })
}
