import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import { favoriteComplexesQueryKey } from './useFavoriteComplexes'
import type { FavoriteComplex } from '../types'

export function useAddFavoriteComplex() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (complexId: number) =>
      apiClient<FavoriteComplex>('/api/favorites/complexes', {
        method: 'POST',
        body: { complexId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteComplexesQueryKey })
    },
  })
}
