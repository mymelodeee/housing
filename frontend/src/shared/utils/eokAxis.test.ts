import { describe, it, expect } from 'vitest'
import { formatEok, buildEokAxis } from './eokAxis'

describe('formatEok', () => {
  it('만원 값을 소수 첫째자리 억 단위로 표시한다', () => {
    expect(formatEok(92000)).toBe('9.2억')
    expect(formatEok(100000)).toBe('10.0억')
    expect(formatEok(5000)).toBe('0.5억')
  })
})

describe('buildEokAxis', () => {
  it('값이 없으면 기본 0~0.5억 범위를 반환한다', () => {
    expect(buildEokAxis([])).toEqual({ min: 0, max: 5000, ticks: [0, 5000] })
  })

  it('데이터 범위를 0.5억 배수로 내림/올림하여 눈금을 0.5억 간격으로 생성한다', () => {
    const axis = buildEokAxis([88000, 95000])

    expect(axis.min).toBe(85000)
    expect(axis.max).toBe(95000)
    expect(axis.ticks).toEqual([85000, 90000, 95000])
  })

  it('min과 max가 같은 0.5억 배수에 속하면 최소 한 구간을 보장한다', () => {
    const axis = buildEokAxis([91000, 92000])

    expect(axis.max).toBeGreaterThan(axis.min)
    expect(axis.ticks.length).toBeGreaterThanOrEqual(2)
  });

  it('모든 눈금 간격이 정확히 0.5억(5000만원)이다', () => {
    const axis = buildEokAxis([70000, 148500]);
    for (let i = 1; i < axis.ticks.length; i += 1) {
      expect(axis.ticks[i] - axis.ticks[i - 1]).toBe(5000);
    }
  });
})
