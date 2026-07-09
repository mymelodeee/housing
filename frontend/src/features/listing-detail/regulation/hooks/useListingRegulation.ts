import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../../shared/api/client'
import type { RegulationInfo } from '../types'

export const listingRegulationQueryKey = (listingId: string) => ['listing-regulation', listingId] as const

export function useListingRegulation(listingId: string) {
  return useQuery({
    queryKey: listingRegulationQueryKey(listingId),
    queryFn: () => apiClient<RegulationInfo>(`/api/listings/${listingId}/regulation`),
  })
}
