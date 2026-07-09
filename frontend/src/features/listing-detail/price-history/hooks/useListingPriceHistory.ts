import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../../shared/api/client'
import type { PriceHistoryResponse } from '../types'

export const listingPriceHistoryQueryKey = (listingId: string) => ['listing-price-history', listingId] as const

export function useListingPriceHistory(listingId: string) {
  return useQuery({
    queryKey: listingPriceHistoryQueryKey(listingId),
    queryFn: () => apiClient<PriceHistoryResponse>(`/api/listings/${listingId}/price-history`),
  })
}
