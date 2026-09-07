import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../../shared/api/client'
import type { RemodelingResponse } from '../types'

export const listingRemodelingQueryKey = (listingId: string) => ['listing-remodeling', listingId] as const

export function useListingRemodeling(listingId: string) {
  return useQuery({
    queryKey: listingRemodelingQueryKey(listingId),
    queryFn: () => apiClient<RemodelingResponse>(`/api/listings/${listingId}/remodeling`),
  })
}
