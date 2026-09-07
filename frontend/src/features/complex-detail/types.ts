import type { PriceHistoryEntry, LookupPeriodType } from '../listing-detail/price-history/types'
import type { JeonseSaleEntry, JeonseEntry, JeonseRatioEntry } from '../listing-detail/jeonse-history/types'
import type { AssignedSchool } from '../listing-detail/schools/types'
import type {
  RemodelingStage,
  RemodelingHouseholds,
  RemodelingContribution,
  RemodelingLoanStatus,
  RemodelingStageHistoryItem,
  RemodelingPriceLink,
} from '../listing-detail/remodeling/types'
import type { LandTransactionPermissionZoneStatus } from '../listing-detail/regulation/types'
import type { LoanScenarioResult } from '../loan-simulation/types'
import type { OwnershipStructure } from '../user-profile/types'

export interface ComplexPriceHistoryResponse {
  complexId: number
  lookupPeriodType: LookupPeriodType
  firstTransactionMonth: string | null
  entries: PriceHistoryEntry[]
  lookupWindowNote?: string
}

export interface ComplexJeonseHistoryResponse {
  complexId: number
  saleEntries: JeonseSaleEntry[]
  jeonseEntries: JeonseEntry[]
  ratioEntries: JeonseRatioEntry[]
  lookupWindowNote: string
}

export interface ComplexAssignedSchoolsResponse {
  complexId: number
  elementarySchool: AssignedSchool | null
  middleSchool: AssignedSchool | null
  assignmentNote: string
}

interface ComplexRemodelingProjectResponse {
  complexId: number
  hasProject: true
  projectName: string | null
  complexName: string | null
  currentStage: RemodelingStage | null
  households: RemodelingHouseholds | null
  contributions: RemodelingContribution[]
  loanStatus: RemodelingLoanStatus | null
  stageHistory: RemodelingStageHistoryItem[]
  priceLink: RemodelingPriceLink | null
  staleAfterDays: number
}

interface ComplexRemodelingEmptyResponse {
  complexId: number
  hasProject: false
  message: string
}

export type ComplexRemodelingResponse = ComplexRemodelingProjectResponse | ComplexRemodelingEmptyResponse

export type SalePriceSource = 'user' | 'transaction' | null

export interface ComplexRegulationInfo {
  complexId: number
  isRegulatedArea: boolean
  isLandTransactionPermissionZone: LandTransactionPermissionZoneStatus
  regulationConfirmationNeeded: boolean
  ltvPercent: number | null
  maxLoanAmount: number | null
  profileMessage: string | null
  effectiveSalePrice: number | null
  salePriceSource: SalePriceSource
  referenceTransactionDate: string | null
  gapInvestmentAllowed: boolean
  occupancyRequirementMonths: number | null
  regionalLoanCapAmount: number | null
}

export interface ComplexLoanSimulationResult {
  complexId: number
  profileIncomplete: boolean
  scenarios: LoanScenarioResult[] | null
  recommendedScenario: OwnershipStructure | null
  policyMortgageNotice: string
  salePriceRequired?: boolean
  effectiveSalePrice: number | null
  salePriceSource: SalePriceSource
  referenceTransactionDate: string | null
}
