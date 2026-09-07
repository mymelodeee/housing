import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'

export const regionCitiesQueryKey = ['region-cities'] as const

export function useRegionCities() {
  return useQuery({
    queryKey: regionCitiesQueryKey,
    queryFn: () => apiClient<{ cities: string[] }>('/api/listings/regions/cities'),
    staleTime: Infinity,
  })
}
