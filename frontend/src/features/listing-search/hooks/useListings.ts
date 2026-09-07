import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { Listing } from '../../../shared/types/listing'

export const listingsQueryKey = (minPrice: number, maxPrice: number, city = '') =>
  ['listings', { minPrice, maxPrice, city }] as const

export function useListings(minPrice: number, maxPrice: number, city = '') {
  return useQuery({
    queryKey: listingsQueryKey(minPrice, maxPrice, city),
    queryFn: () => {
      const cityParam = city ? `&city=${encodeURIComponent(city)}` : ''
      return apiClient<Listing[]>(`/api/listings?minPrice=${minPrice}&maxPrice=${maxPrice}${cityParam}`)
    },
  })
}
