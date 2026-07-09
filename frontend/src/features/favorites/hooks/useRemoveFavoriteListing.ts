import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import { favoriteListingsQueryKey } from './useFavoriteListings'

export function useRemoveFavoriteListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (listingId: number) =>
      apiClient(`/api/favorites/listings/${listingId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteListingsQueryKey })
    },
  })
}
