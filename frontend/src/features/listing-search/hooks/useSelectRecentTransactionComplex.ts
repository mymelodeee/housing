import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'

interface SelectRecentTransactionComplexResult {
  complexId: number
}

export function useSelectRecentTransactionComplex() {
  return useMutation({
    mutationFn: (cacheId: number) =>
      apiClient<SelectRecentTransactionComplexResult>('/api/listings/market-search/select-complex', {
        method: 'POST',
        body: { id: cacheId },
      }),
  })
}
