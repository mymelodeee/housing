import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { UserProfile } from '../types'

export const userProfileQueryKey = ['user-profile'] as const

export function useUserProfile() {
  return useQuery({
    queryKey: userProfileQueryKey,
    queryFn: () => apiClient<UserProfile>('/api/user-profile'),
  })
}
