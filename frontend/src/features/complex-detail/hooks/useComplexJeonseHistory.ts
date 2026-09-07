import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComplexJeonseHistoryResponse } from '../types'

export const complexJeonseHistoryQueryKey = (complexId: string) => ['complex-jeonse-history', complexId] as const

export function useComplexJeonseHistory(complexId: string) {
  return useQuery({
    queryKey: complexJeonseHistoryQueryKey(complexId),
    queryFn: () => apiClient<ComplexJeonseHistoryResponse>(`/api/complexes/${complexId}/jeonse-history`),
  })
}
