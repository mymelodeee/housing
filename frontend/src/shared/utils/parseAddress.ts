export interface ParsedAddress {
  cityDistrict: string
  neighborhood: string | null
}

const DETAIL_TOKEN_PATTERN = /(동|로|길)$/
const NEIGHBORHOOD_TOKEN_PATTERN = /동$/
const LOT_NUMBER_PATTERN = /^\d/

// 단지 주소 문자열에서 "시/군/구"와 "동" 레벨을 최선노력으로 추출한다. 도로명(~로/~길)과
// 지번(숫자로 시작)이 섞여 있고 "서울"처럼 시/도 접미사가 생략된 표기도 있어 완벽한 행정구역
// 파싱은 불가능하다 — 비교셋 단지 추가 화면의 카테고리 그룹핑(시/군/구 > 동 > 단지명) 용도로만
// 쓰며, 실패해도 전체 주소를 하나의 그룹으로 묶을 뿐 예외를 던지지 않는다.
export function parseAddress(address: string): ParsedAddress {
  const tokens = address.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { cityDistrict: address, neighborhood: null }

  const stopIndex = tokens.findIndex((token) => DETAIL_TOKEN_PATTERN.test(token) || LOT_NUMBER_PATTERN.test(token))
  const cityDistrictTokens = stopIndex === -1 ? tokens.slice(0, -1) : tokens.slice(0, stopIndex)
  const neighborhoodToken = stopIndex !== -1 && NEIGHBORHOOD_TOKEN_PATTERN.test(tokens[stopIndex]) ? tokens[stopIndex] : null

  return {
    cityDistrict: cityDistrictTokens.length > 0 ? cityDistrictTokens.join(' ') : address,
    neighborhood: neighborhoodToken,
  }
}
