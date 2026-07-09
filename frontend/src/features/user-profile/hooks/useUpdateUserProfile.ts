import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import { userProfileQueryKey } from './useUserProfile'
import type { UserProfile, UserProfileUpdateRequest } from '../types'

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: UserProfileUpdateRequest) =>
      apiClient<UserProfile>('/api/user-profile', { method: 'PUT', body: patch }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userProfileQueryKey })
    },
  })
}
