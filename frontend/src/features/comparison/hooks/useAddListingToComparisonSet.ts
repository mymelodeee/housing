import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import { comparisonSetQueryKey } from './useComparisonSet'
import type { ComparisonSetDetail } from '../types'

export function useAddListingToComparisonSet(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (listingId: number) =>
      apiClient<ComparisonSetDetail>(`/api/comparison-sets/${setId}/listings`, {
        method: 'POST',
        body: { listingId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comparisonSetQueryKey(setId) })
    },
  })
}
