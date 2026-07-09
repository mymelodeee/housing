export type RemodelingStatus = '해당없음' | '추진중' | '완료'

export type ReconstructionStatus =
  | '해당없음'
  | '추진위원회'
  | '조합설립인가'
  | '사업시행인가'
  | '관리처분인가'
  | '이주철거중'
  | '착공'

export type LandTransactionPermissionZoneStatus = boolean | '확인필요'

export interface ListingComplex {
  id: number
  complexName: string
  address: string
  completionYear: number
  remodelingStatus: RemodelingStatus
  reconstructionStatus: ReconstructionStatus
  isRegulatedArea: boolean
  isLandTransactionPermissionZone: LandTransactionPermissionZoneStatus
  nearestShuttleStopName: string | null
  nearestShuttleStopDistance: number | null
  shuttleCommuteMinutes: number | null
  latitude: number
  longitude: number
}

export interface ApartmentComplexSummary {
  id: number
  complexName: string
  address: string
  completionYear: number
  remodelingStatus: RemodelingStatus
  reconstructionStatus: ReconstructionStatus
  isRegulatedArea: boolean
  isLandTransactionPermissionZone: LandTransactionPermissionZoneStatus
  nearestShuttleStopName: string | null
  nearestShuttleStopDistance: number | null
  shuttleCommuteMinutes: number | null
}

export interface Listing {
  id: number
  complexId: number
  salePrice: number
  exclusiveArea: number
  complex: ListingComplex
}
