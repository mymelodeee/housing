import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import { comparisonSetQueryKey } from './useComparisonSet'
import type { ComparisonSetDetail } from '../types'

export function useAddComplexToComparisonSet(setId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (complexId: number) =>
      apiClient<ComparisonSetDetail>(`/api/comparison-sets/${setId}/complexes`, {
        method: 'POST',
        body: { complexId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comparisonSetQueryKey(setId) })
    },
  })
}
