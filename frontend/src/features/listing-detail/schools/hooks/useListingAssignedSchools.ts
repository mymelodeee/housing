import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../../shared/api/client'
import type { AssignedSchoolsResponse } from '../types'

export const listingAssignedSchoolsQueryKey = (listingId: string) => ['listing-assigned-schools', listingId] as const

export function useListingAssignedSchools(listingId: string) {
  return useQuery({
    queryKey: listingAssignedSchoolsQueryKey(listingId),
    queryFn: () => apiClient<AssignedSchoolsResponse>(`/api/listings/${listingId}/assigned-schools`),
  })
}
