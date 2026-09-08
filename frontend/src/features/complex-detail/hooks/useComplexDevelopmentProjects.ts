import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComplexDevelopmentProjectsResponse } from '../types'

export const complexDevelopmentProjectsQueryKey = (complexId: string) =>
  ['complex-development-projects', complexId] as const

export function useComplexDevelopmentProjects(complexId: string) {
  return useQuery({
    queryKey: complexDevelopmentProjectsQueryKey(complexId),
    queryFn: () => apiClient<ComplexDevelopmentProjectsResponse>(`/api/complexes/${complexId}/development-projects`),
  })
}
