import { parseAddress } from '../../../shared/utils/parseAddress'

export interface LocationGroupedComplex {
  id: number
  complexName: string
}

const UNKNOWN_NEIGHBORHOOD = '(동 정보 없음)'

// 시/군/구 > 동 > 단지명 3단계로 그룹핑한다(비교셋에 단지를 추가할 때 즐겨찾기 1~3개로
// 제한되지 않고 전체 단지를 지역별로 탐색해 고를 수 있도록 하기 위함).
export function groupComplexesByLocation(
  complexes: { id: number; complexName: string; address: string }[],
): Map<string, Map<string, LocationGroupedComplex[]>> {
  const tree = new Map<string, Map<string, LocationGroupedComplex[]>>()

  for (const complex of complexes) {
    const { cityDistrict, neighborhood } = parseAddress(complex.address)
    const neighborhoodKey = neighborhood ?? UNKNOWN_NEIGHBORHOOD

    if (!tree.has(cityDistrict)) tree.set(cityDistrict, new Map())
    const neighborhoodMap = tree.get(cityDistrict)!

    if (!neighborhoodMap.has(neighborhoodKey)) neighborhoodMap.set(neighborhoodKey, [])
    neighborhoodMap.get(neighborhoodKey)!.push({ id: complex.id, complexName: complex.complexName })
  }

  return tree
}
