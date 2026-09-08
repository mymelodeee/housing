export interface JeonseSaleEntry {
  transactionDate: string
  transactionPrice: number
  exclusiveArea?: number
  dataSource: string
}

export interface JeonseEntry {
  transactionDate: string
  deposit: number
  exclusiveArea?: number
  dataSource: string
}

export interface JeonseRatioEntry {
  month: string
  jeonseRatioPercent: number
}

export interface JeonseHistoryResponse {
  listingId: number
  complexId: number
  saleEntries: JeonseSaleEntry[]
  jeonseEntries: JeonseEntry[]
  ratioEntries: JeonseRatioEntry[]
  lookupWindowNote: string
}
