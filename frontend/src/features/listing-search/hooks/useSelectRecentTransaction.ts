import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'

interface SelectRecentTransactionResult {
  listingId: number
}

export function useSelectRecentTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cacheId: number) =>
      apiClient<SelectRecentTransactionResult>('/api/listings/market-search/select', {
        method: 'POST',
        body: { id: cacheId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}
