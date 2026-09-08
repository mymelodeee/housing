export interface PriceHistoryEntry {
  transactionDate: string
  transactionPrice: number
  exclusiveArea?: number
  dataSource: string
}

export type LookupPeriodType = '최근 20년' | '최초거래 이후' | '실거래 이력 없음'

export interface PriceHistoryResponse {
  listingId: number
  complexId: number
  lookupPeriodType: LookupPeriodType
  firstTransactionMonth: string | null
  entries: PriceHistoryEntry[]
}
