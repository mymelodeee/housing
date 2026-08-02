import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { Listing } from '../../../shared/types/listing'

export const listingQueryKey = (listingId: string) => ['listing', listingId] as const

export function useListing(listingId: string) {
  return useQuery({
    queryKey: listingQueryKey(listingId),
    queryFn: () => apiClient<Listing>(`/api/listings/${listingId}`),
  })
}
