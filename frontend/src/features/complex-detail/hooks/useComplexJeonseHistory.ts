import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComplexJeonseHistoryResponse } from '../types'

export const complexJeonseHistoryQueryKey = (complexId: string, exclusiveArea?: number | null) =>
  ['complex-jeonse-history', complexId, exclusiveArea ?? null] as const

export function useComplexJeonseHistory(complexId: string, exclusiveArea?: number | null) {
  return useQuery({
    queryKey: complexJeonseHistoryQueryKey(complexId, exclusiveArea),
    queryFn: () => {
      const query = typeof exclusiveArea === 'number' ? `?exclusiveArea=${exclusiveArea}` : ''
      return apiClient<ComplexJeonseHistoryResponse>(`/api/complexes/${complexId}/jeonse-history${query}`)
    },
  })
}
