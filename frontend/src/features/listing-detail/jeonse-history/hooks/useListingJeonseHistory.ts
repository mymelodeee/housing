import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../../shared/api/client'
import type { JeonseHistoryResponse } from '../types'

export const listingJeonseHistoryQueryKey = (listingId: string) => ['listing-jeonse-history', listingId] as const

export function useListingJeonseHistory(listingId: string) {
  return useQuery({
    queryKey: listingJeonseHistoryQueryKey(listingId),
    queryFn: () => apiClient<JeonseHistoryResponse>(`/api/listings/${listingId}/jeonse-history`),
  })
}
