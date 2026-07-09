export type LandTransactionPermissionZoneStatus = boolean | '확인필요'

export interface RegulationInfo {
  listingId: number
  complexId: number
  isRegulatedArea: boolean
  isLandTransactionPermissionZone: LandTransactionPermissionZoneStatus
  regulationConfirmationNeeded: boolean
  ltvPercent: number | null
  maxLoanAmount: number | null
  profileMessage: string | null
  gapInvestmentAllowed: boolean
  occupancyRequirementMonths: number | null
  regionalLoanCapAmount: number | null
}
