import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../../shared/api/client'
import type { LocalityInfo } from '../types'

export const listingLocalityQueryKey = (listingId: string) => ['listing-locality', listingId] as const

export function useListingLocality(listingId: string) {
  return useQuery({
    queryKey: listingLocalityQueryKey(listingId),
    queryFn: () => apiClient<LocalityInfo>(`/api/listings/${listingId}/locality`),
  })
}
