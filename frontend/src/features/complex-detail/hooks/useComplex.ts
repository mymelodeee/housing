import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ApartmentComplexSummary } from '../../../shared/types/listing'
import type { LocalityAttributes } from '../../../shared/types/locality'

export interface ComplexDetail extends ApartmentComplexSummary {
  latitude: number
  longitude: number
  remodelingCompletionYear: number | null
  nearbyRedevelopmentInfo: string | null
  localityAttributes: LocalityAttributes
  priceRange: { minPrice: number; maxPrice: number; avgPrice: number } | '매물 없음'
}

export const complexQueryKey = (complexId: string) => ['complex', complexId] as const

export function useComplex(complexId: string) {
  return useQuery({
    queryKey: complexQueryKey(complexId),
    queryFn: () => apiClient<ComplexDetail>(`/api/complexes/${complexId}`),
  })
}
