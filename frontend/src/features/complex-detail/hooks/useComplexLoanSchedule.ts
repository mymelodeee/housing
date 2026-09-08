import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/client'
import type { LoanScheduleResponse } from '../types'

export interface LoanScheduleParams {
  principal?: number
  interestRatePercent?: number
  graceMonths?: number
  years?: number
}

export const complexLoanScheduleQueryKey = (complexId: string, params: LoanScheduleParams) =>
  ['complex-loan-schedule', complexId, params] as const

export function fetchComplexLoanSchedule(complexId: string, params: LoanScheduleParams) {
  const query = new URLSearchParams()
  if (typeof params.principal === 'number') query.set('principal', String(params.principal))
  if (typeof params.interestRatePercent === 'number') query.set('interestRatePercent', String(params.interestRatePercent))
  if (typeof params.graceMonths === 'number') query.set('graceMonths', String(params.graceMonths))
  if (typeof params.years === 'number') query.set('years', String(params.years))
  const queryString = query.toString()
  return apiClient<LoanScheduleResponse>(`/api/complexes/${complexId}/loan-schedule${queryString ? `?${queryString}` : ''}`)
}

export function useComplexLoanSchedule(complexId: string, params: LoanScheduleParams, enabled: boolean) {
  return useQuery({
    queryKey: complexLoanScheduleQueryKey(complexId, params),
    queryFn: () => fetchComplexLoanSchedule(complexId, params),
    enabled,
  })
}
