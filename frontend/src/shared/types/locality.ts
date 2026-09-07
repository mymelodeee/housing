export type RemodelingStatus = '해당없음' | '추진중' | '완료'
export type ReconstructionStatus =
  | '해당없음' | '추진위원회' | '조합설립인가' | '사업시행인가' | '관리처분인가' | '이주철거중' | '착공'

export interface LocalityAttributes {
  transportation: string
  commercialArea: string
  schoolDistrict: string
  gangnamAccessibility: string
  entertainmentAndParks: string
  developmentProspects: string
  nearbyJobs: string
}

export interface LocalityDisplayData {
  completionYear: number | null
  remodelingStatus: RemodelingStatus
  reconstructionStatus: ReconstructionStatus
  nearbyRedevelopmentInfo: string | null
  localityAttributes: LocalityAttributes
}
