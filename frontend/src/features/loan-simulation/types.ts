import type { OwnershipStructure } from '../user-profile/types'

export interface LoanScenarioResult {
  ownershipStructure: OwnershipStructure
  ltvPercent: number
  maxLoanAmount: number
  requiredCapital: number
  capitalSufficient: boolean
  dsrUsageRate: number
  monthlyRepayment10y: number
  monthlyRepayment20y: number
  monthlyRepayment30y: number
  occupancyRequirementMonths: number | null
}

export interface LoanSimulationResult {
  listingId: number
  profileIncomplete: boolean
  scenarios: LoanScenarioResult[] | null
  recommendedScenario: OwnershipStructure | null
  policyMortgageNotice: string
}
