import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { FavoriteListing } from '../types'

export const favoriteListingsQueryKey = ['favorites', 'listings'] as const

export function useFavoriteListings() {
  return useQuery({
    queryKey: favoriteListingsQueryKey,
    queryFn: () => apiClient<FavoriteListing[]>('/api/favorites/listings'),
  })
}
