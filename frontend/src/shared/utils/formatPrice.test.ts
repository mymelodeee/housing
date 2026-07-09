import { describe, it, expect } from 'vitest'
import { formatPriceKorean } from './formatPrice'

describe('formatPriceKorean', () => {
  it('나머지가 있으면 "X억 Y,YYY만원" 형식으로 표시한다', () => {
    expect(formatPriceKorean(95000)).toBe('9억 5,000만원')
  })

  it('나머지가 정확히 0이면 "만원" 접미사 없이 "X억"만 표시한다', () => {
    expect(formatPriceKorean(100000)).toBe('10억')
  })

  it('88000은 "8억 8,000만원"으로 표시한다', () => {
    expect(formatPriceKorean(88000)).toBe('8억 8,000만원')
  })

  it('70000은 "7억"으로 표시한다', () => {
    expect(formatPriceKorean(70000)).toBe('7억')
  })

  it('149000은 "14억 9,000만원"으로 표시한다', () => {
    expect(formatPriceKorean(149000)).toBe('14억 9,000만원')
  })

  it('나머지가 만원 단위 미만이어도 천단위 구분 기호로 표시한다', () => {
    expect(formatPriceKorean(123456)).toBe('12억 3,456만원')
  })
})
