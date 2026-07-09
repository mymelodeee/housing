import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { Listing } from '../../../shared/types/listing'

export const listingsQueryKey = (minPrice: number, maxPrice: number) =>
  ['listings', { minPrice, maxPrice }] as const

export function useListings(minPrice: number, maxPrice: number) {
  return useQuery({
    queryKey: listingsQueryKey(minPrice, maxPrice),
    queryFn: () => apiClient<Listing[]>(`/api/listings?minPrice=${minPrice}&maxPrice=${maxPrice}`),
  })
}
