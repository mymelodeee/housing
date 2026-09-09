// 연식(Building Age) = 준공년도 기준 경과년수(도메인 §4.1). 단지 상세 개요(LocalityAxisList)와
// 비교 화면(buildComparisonRows)이 동일한 정의를 쓰도록 이 한 곳에서만 계산한다.
export function calcHousingAge(completionYear: number, now: Date = new Date()): number {
  return now.getFullYear() - completionYear + 1
}
