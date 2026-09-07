export interface RegionalTransaction {
  id: number
  lawdCd: string
  kaptCode: string | null
  complexName: string
  address: string | null
  exclusiveArea: number
  salePrice: number
  transactionDate: string
  householdCount: number | null
  latitude: number | null
  longitude: number | null
  collectedAt: string
}
