import type { LocalityAttributes, RemodelingStatus, ReconstructionStatus } from '../../shared/types/locality'

export type ComparisonTargetType = 'complex' | 'listing'

export type PriceRangeValue =
  | { minPrice: number; maxPrice: number; avgPrice: number }
  | '매물 없음'

export interface ComparisonComplexItem {
  complexId: number
  complexName: string
  completionYear: number | null
  remodelingStatus: RemodelingStatus
  reconstructionStatus: ReconstructionStatus
  nearbyRedevelopmentInfo: string | null
  localityAttributes: LocalityAttributes
  shuttleCommuteMinutes: number | null
  priceRange: PriceRangeValue
}

export interface ComparisonListingItem {
  listingId: number
  complexId: number
  salePrice: number
  exclusiveArea: number
  complexName: string
  completionYear: number | null
  remodelingStatus: RemodelingStatus
  reconstructionStatus: ReconstructionStatus
  nearbyRedevelopmentInfo: string | null
  localityAttributes: LocalityAttributes
  shuttleCommuteMinutes: number | null
}

export interface ComparisonSetSummary {
  id: number
  targetType: ComparisonTargetType
  createdAt: string
  itemCount: number
  itemNames: string[]
}

export interface ComparisonSetDetail {
  id: number
  userProfileId: number
  targetType: ComparisonTargetType
  createdAt: string
  complexes: ComparisonComplexItem[] | null
  listings: ComparisonListingItem[] | null
}
