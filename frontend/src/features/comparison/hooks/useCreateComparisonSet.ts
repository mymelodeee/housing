import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { ComparisonSetDetail, ComparisonTargetType } from '../types'

interface CreateComparisonSetInput {
  targetType: ComparisonTargetType
  complexIds?: number[]
  listingIds?: number[]
}

export function useCreateComparisonSet() {
  return useMutation({
    mutationFn: (input: CreateComparisonSetInput) =>
      apiClient<ComparisonSetDetail>('/api/comparison-sets', { method: 'POST', body: input }),
  })
}
