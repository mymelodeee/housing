export type OwnershipStructure = '단독' | '부부합산'
export type HousingOwnershipTier = '무주택' | '1주택' | '다주택'

export interface UserProfile {
  id: number
  workplace: '화성' | '평택' | null
  ownershipStructure: OwnershipStructure | null
  annualIncome: number | null
  annualBonus: number | null
  availableCapital: number | null
  housingOwnershipTier: HousingOwnershipTier | null
  isFirstTimeBuyer: boolean | null
}

export interface UserProfileUpdateRequest {
  ownershipStructure?: OwnershipStructure | null
  annualIncome?: number | null
  annualBonus?: number | null
  availableCapital?: number | null
  housingOwnershipTier?: HousingOwnershipTier | null
  isFirstTimeBuyer?: boolean | null
}
