import { describe, it, expect } from 'vitest'
import { toPyeong, formatAreaWithPyeong } from './formatArea'

describe('toPyeong', () => {
  it('m^2를 평으로 변환해 소수 첫째자리까지 반올림한다', () => {
    expect(toPyeong(84.98)).toBe(25.7)
    expect(toPyeong(59.95)).toBe(18.1)
  })

  it('정확히 나눠떨어지는 값도 올바르게 변환한다', () => {
    expect(toPyeong(33.05785)).toBe(10)
  })
})

describe('formatAreaWithPyeong', () => {
  it('m^2 값 옆에 평 환산값을 괄호로 붙인다', () => {
    expect(formatAreaWithPyeong(84.98)).toBe('84.98m² (25.7평)')
  })
})
