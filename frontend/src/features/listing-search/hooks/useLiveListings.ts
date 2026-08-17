import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { RegionalListing } from '../types'

export const liveListingsQueryKey = (minPrice: number, maxPrice: number) =>
  ['live-listings', { minPrice, maxPrice }] as const

export function useLiveListings(minPrice: number, maxPrice: number, enabled: boolean) {
  return useQuery({
    queryKey: liveListingsQueryKey(minPrice, maxPrice),
    queryFn: () => apiClient<RegionalListing[]>(`/api/listings/live-search?minPrice=${minPrice}&maxPrice=${maxPrice}`),
    enabled,
  })
}
