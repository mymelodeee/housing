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
  availableExclusiveAreas: number[]
  lookupWindowNote: string
}

export interface ComplexAssignedSchoolsResponse {
  complexId: number
  elementarySchool: AssignedSchool | null
  middleSchool: AssignedSchool | null
  highSchool: AssignedSchool | null
  academyCount: number | null
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

export type DevelopmentProjectCategory = '철도' | '도로' | '택지개발' | '기타'
export type DevelopmentProjectStatus = '계획' | '확정' | '착공' | '공사중' | '완료' | '취소'

export interface DevelopmentProjectSource {
  name: string | null
  url: string | null
  sourceType: '고시' | '공고' | '보도자료' | '뉴스' | '기타'
  sourceDate: string | null
  checkedAt: string
  reliability: 'high' | 'medium' | 'low'
  isAccessible: boolean
}

export interface DevelopmentProject {
  id: number
  projectName: string
  category: DevelopmentProjectCategory
  status: DevelopmentProjectStatus
  effectiveDate: string | null
  checkedAt: string
  confidence: 'high' | 'medium' | 'low'
  isStale: boolean
  isConflicted: boolean
  note: string | null
  sources: DevelopmentProjectSource[]
}

export interface ComplexDevelopmentProjectsResponse {
  complexId: number
  projects: DevelopmentProject[]
}

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

export interface InterestRateMeta {
  ratePercent: number
  referencePeriod: string
  checkedAt: string
  daysSinceChecked: number
  isStale: boolean
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
  interestRateMeta?: InterestRateMeta
}

export interface AcquisitionCostsResponse {
  complexId: number
  effectiveSalePrice: number | null
  salePriceSource: SalePriceSource
  referenceTransactionDate: string | null
  message?: string
  homeCountAfterPurchase: number
  exclusiveArea: number
  acquisitionTax: { amount: number; ratePercent: number; isHeavyTaxRate: boolean; rateLabel: string }
  localEducationTax: { amount: number; ratePercent: number }
  ruralSpecialTax: { amount: number; ratePercent: number }
  brokerageFee: {
    amount: number
    appliedRatePercent: number
    capRatePercent: number
    isCapped: boolean
    vatIncluded: boolean
    estimateType: 'ESTIMATE'
  }
  stampDuty: { amount: number }
  totalCost: number
}

export interface LoanScheduleRow {
  month: number
  payment: number
  interest: number
  principal: number
  balance: number
}

interface LoanScheduleUnavailableResponse {
  complexId: number
  schedule: null
  message: string
}

interface LoanScheduleAvailableResponse {
  complexId: number
  principal: number
  interestRatePercent: number
  years: number
  graceMonths: number
  message?: undefined
  rows: LoanScheduleRow[]
  regularMonthlyPayment: number
  graceMonthlyPayment: number
  cliffMonth: number
  postCliffMonthlyPayment: number
  cliffIncrease: number
  totalInterest: number
  totalPrincipal: number
  endBalance: number
}

export type LoanScheduleResponse = LoanScheduleUnavailableResponse | LoanScheduleAvailableResponse

export type PublicPriceSource = 'user' | 'estimated' | null

interface HoldingTaxEstimateUnavailableResponse {
  complexId: number
  effectiveSalePrice: null
  salePriceSource: null
  referenceTransactionDate: null
  publicPrice: null
  publicPriceSource: null
  message: string
}

interface HoldingTaxEstimateAvailableResponse {
  complexId: number
  effectiveSalePrice: number | null
  salePriceSource: SalePriceSource
  referenceTransactionDate: string | null
  message?: undefined
  publicPrice: number
  publicPriceSource: PublicPriceSource
  homeCountAfterPurchase: number
  isOneHouse: boolean
  propertyTax: {
    fairMarketValueRatio: number
    isSpecialOneHouse: boolean
    propertyTax: number
    localEducationTax: number
    urbanAreaTax: number
    total: number
  }
  comprehensiveTax: {
    deduction: number
    taxableBase: number
    comprehensiveTax: number
    ruralSpecialTax: number
    total: number
    estimateType: 'ESTIMATE'
  }
  totalAnnualHoldingTax: number
}

export type HoldingTaxEstimateResponse = HoldingTaxEstimateUnavailableResponse | HoldingTaxEstimateAvailableResponse
