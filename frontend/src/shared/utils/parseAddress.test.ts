import { describe, it, expect } from 'vitest'
import { parseAddress } from './parseAddress'

describe('parseAddress', () => {
  it.each([
    ['성남시 중원구 도촌동 704', '성남시 중원구', '도촌동'],
    ['서울 강동구 길동 483', '서울 강동구', '길동'],
    ['용인기흥 마북동 524-8', '용인기흥', '마북동'],
    ['수원시 영통구 영통동 957-6', '수원시 영통구', '영통동'],
    ['성남시 분당구 서현동 91', '성남시 분당구', '서현동'],
  ])('실제 DB 주소 "%s"에서 시/군/구 "%s", 동 "%s"를 추출한다', (address, cityDistrict, neighborhood) => {
    expect(parseAddress(address)).toEqual({ cityDistrict, neighborhood })
  })

  it.each([
    ['경기도 화성시 동탄대로시범길 276', '경기도 화성시'],
    ['경기 평택시 고덕국제대로 77', '경기 평택시'],
    ['경기도 용인시 기흥구 용인향교로 29', '경기도 용인시 기흥구'],
  ])('도로명주소 "%s"는 동 없이 시/군/구 "%s"까지만 추출한다', (address, cityDistrict) => {
    const result = parseAddress(address)
    expect(result.cityDistrict).toBe(cityDistrict)
    expect(result.neighborhood).toBeNull()
  })

  it('빈 문자열이어도 예외를 던지지 않는다', () => {
    expect(() => parseAddress('')).not.toThrow()
  })
})
