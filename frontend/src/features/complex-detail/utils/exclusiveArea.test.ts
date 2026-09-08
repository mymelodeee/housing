import { describe, it, expect } from 'vitest'
import { getAvailableExclusiveAreas, filterByExclusiveArea } from './exclusiveArea'

describe('getAvailableExclusiveAreas', () => {
  it('exclusiveArea 값을 오름차순 중복 제거해 반환한다', () => {
    const entries = [{ exclusiveArea: 84.98 }, { exclusiveArea: 59.95 }, { exclusiveArea: 84.98 }]
    expect(getAvailableExclusiveAreas(entries)).toEqual([59.95, 84.98])
  })

  it('exclusiveArea가 없는 항목은 제외한다', () => {
    const entries = [{ exclusiveArea: 84.98 }, {}, { exclusiveArea: undefined }]
    expect(getAvailableExclusiveAreas(entries)).toEqual([84.98])
  })

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(getAvailableExclusiveAreas([])).toEqual([])
  })
})

describe('filterByExclusiveArea', () => {
  const entries = [{ exclusiveArea: 84.98, id: 1 }, { exclusiveArea: 59.95, id: 2 }]

  it('area가 null이면 전체를 그대로 반환한다', () => {
    expect(filterByExclusiveArea(entries, null)).toBe(entries)
  })

  it('area가 지정되면 일치하는 항목만 반환한다', () => {
    expect(filterByExclusiveArea(entries, 84.98)).toEqual([{ exclusiveArea: 84.98, id: 1 }])
  })

  it('일치하는 항목이 없으면 빈 배열을 반환한다', () => {
    expect(filterByExclusiveArea(entries, 100)).toEqual([])
  })
})
