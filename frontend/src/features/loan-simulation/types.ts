import type { OwnershipStructure } from '../user-profile/types'

export interface GraduatedRepayment {
  initialMonthlyPayment: number
  finalMonthlyPayment: number
}

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
  interestRatePercent: number
  interestRateSource: string
  graduatedRepayment10y: GraduatedRepayment
  graduatedRepayment20y: GraduatedRepayment
  graduatedRepayment30y: GraduatedRepayment
}

export interface LoanSimulationResult {
  listingId: number
  profileIncomplete: boolean
  scenarios: LoanScenarioResult[] | null
  recommendedScenario: OwnershipStructure | null
  policyMortgageNotice: string
}
