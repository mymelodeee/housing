export interface AssignedSchool {
  schoolName: string
  distanceMeters: number
}

export interface AssignedSchoolsResponse {
  listingId: number
  complexId: number
  elementarySchool: AssignedSchool | null
  middleSchool: AssignedSchool | null
  assignmentNote: string
}
