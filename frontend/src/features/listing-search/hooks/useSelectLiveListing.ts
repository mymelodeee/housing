import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'

interface SelectLiveListingResult {
  listingId: number
}

export function useSelectLiveListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cacheId: number) =>
      apiClient<SelectLiveListingResult>('/api/listings/live-search/select', {
        method: 'POST',
        body: { id: cacheId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}
