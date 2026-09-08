import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { AcquisitionCostsResponse } from '../types'

export interface AcquisitionCostsParams {
  salePrice?: number
  exclusiveArea?: number
  homeCount?: number
  isHeavyTaxExempt?: boolean
  negotiatedRatePercent?: number
}

export const complexAcquisitionCostsQueryKey = (complexId: string, params: AcquisitionCostsParams) =>
  ['complex-acquisition-costs', complexId, params] as const

export function useComplexAcquisitionCosts(complexId: string, params: AcquisitionCostsParams) {
  return useQuery({
    queryKey: complexAcquisitionCostsQueryKey(complexId, params),
    queryFn: () => {
      const query = new URLSearchParams()
      if (typeof params.salePrice === 'number') query.set('salePrice', String(params.salePrice))
      if (typeof params.exclusiveArea === 'number') query.set('exclusiveArea', String(params.exclusiveArea))
      if (typeof params.homeCount === 'number') query.set('homeCount', String(params.homeCount))
      if (typeof params.isHeavyTaxExempt === 'boolean') query.set('isHeavyTaxExempt', String(params.isHeavyTaxExempt))
      if (typeof params.negotiatedRatePercent === 'number') query.set('negotiatedRatePercent', String(params.negotiatedRatePercent))
      const queryString = query.toString()
      return apiClient<AcquisitionCostsResponse>(`/api/complexes/${complexId}/acquisition-costs${queryString ? `?${queryString}` : ''}`)
    },
  })
}
