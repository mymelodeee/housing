import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { FavoriteComplex } from '../types'

export const favoriteComplexesQueryKey = ['favorites', 'complexes'] as const

export function useFavoriteComplexes() {
  return useQuery({
    queryKey: favoriteComplexesQueryKey,
    queryFn: () => apiClient<FavoriteComplex[]>('/api/favorites/complexes'),
  })
}
