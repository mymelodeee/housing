import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import { favoriteComplexesQueryKey } from './useFavoriteComplexes'

export function useRemoveFavoriteComplex() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (complexId: number) =>
      apiClient(`/api/favorites/complexes/${complexId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteComplexesQueryKey })
    },
  })
}
