import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { HoldingTaxEstimateResponse } from '../types'

export interface HoldingTaxEstimateParams {
  salePrice?: number
  publicPrice?: number
  publicRatio?: number
  homeCount?: number
  includeUrbanAreaTax?: boolean
}

export const complexHoldingTaxEstimateQueryKey = (complexId: string, params: HoldingTaxEstimateParams) =>
  ['complex-holding-tax-estimate', complexId, params] as const

export function useComplexHoldingTaxEstimate(complexId: string, params: HoldingTaxEstimateParams, enabled = true) {
  return useQuery({
    queryKey: complexHoldingTaxEstimateQueryKey(complexId, params),
    queryFn: () => {
      const query = new URLSearchParams()
      if (typeof params.salePrice === 'number') query.set('salePrice', String(params.salePrice))
      if (typeof params.publicPrice === 'number') query.set('publicPrice', String(params.publicPrice))
      if (typeof params.publicRatio === 'number') query.set('publicRatio', String(params.publicRatio))
      if (typeof params.homeCount === 'number') query.set('homeCount', String(params.homeCount))
      if (typeof params.includeUrbanAreaTax === 'boolean') query.set('includeUrbanAreaTax', String(params.includeUrbanAreaTax))
      const queryString = query.toString()
      return apiClient<HoldingTaxEstimateResponse>(`/api/complexes/${complexId}/holding-tax-estimate${queryString ? `?${queryString}` : ''}`)
    },
    enabled,
  })
}
