export type RemodelingStatus = 'confirmed' | 'estimated' | 'proposal' | 'unknown'

export type SourceReliability = 'high' | 'medium' | 'low'

export interface RemodelingSource {
  name: string
  url: string | null
  sourceDate: string | null
  reliability: SourceReliability
}

interface RemodelingTracked {
  status: RemodelingStatus
  effectiveDate: string | null
  checkedAt: string | null
  daysSinceChecked: number
  isStale: boolean
  isConflicted?: boolean
  source: RemodelingSource | null
}

export interface RemodelingStage extends RemodelingTracked {
  value: string
}

export interface RemodelingHouseholds extends RemodelingTracked {
  before: number | null
  after: number | null
  increase: number | null
}

export interface RemodelingContribution extends RemodelingTracked {
  unitType: string | null
  amount: number | null
  unit: string
}

export interface RemodelingLoanStatus extends RemodelingTracked {
  value: string
}

export interface RemodelingStageHistoryItem {
  stage: string
  effectiveDate: string | null
  status: RemodelingStatus
  checkedAt: string | null
  source: RemodelingSource | null
}

export interface RemodelingPriceLink {
  recentTransactionPrice: number | null
  recentTransactionDate: string | null
  estimatedTotalCost: number | null
  note: string
}

interface RemodelingProjectResponse {
  listingId: number
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

interface RemodelingEmptyResponse {
  listingId: number
  complexId: number
  hasProject: false
  message: string
}

export type RemodelingResponse = RemodelingProjectResponse | RemodelingEmptyResponse
