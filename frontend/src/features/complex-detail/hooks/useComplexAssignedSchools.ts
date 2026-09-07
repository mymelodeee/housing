import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComplexAssignedSchoolsResponse } from '../types'

export const complexAssignedSchoolsQueryKey = (complexId: string) => ['complex-assigned-schools', complexId] as const

export function useComplexAssignedSchools(complexId: string) {
  return useQuery({
    queryKey: complexAssignedSchoolsQueryKey(complexId),
    queryFn: () => apiClient<ComplexAssignedSchoolsResponse>(`/api/complexes/${complexId}/assigned-schools`),
  })
}
