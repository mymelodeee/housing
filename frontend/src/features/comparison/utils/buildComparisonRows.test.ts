import { describe, it, expect } from 'vitest'
import {
  calcHousingAge,
  formatPriceRange,
  buildComplexComparisonRows,
  buildListingComparisonRows,
} from './buildComparisonRows'
import type { ComparisonComplexItem, ComparisonListingItem, PriceRangeValue } from '../types'
import type { LocalityAttributes } from '../../../shared/types/locality'

const localityAttributes: LocalityAttributes = {
  transportation: '좋음',
  commercialArea: '보통',
  schoolDistrict: '좋음',
  gangnamAccessibility: '보통',
  entertainmentAndParks: '좋음',
  developmentProspects: '보통',
  nearbyJobs: '좋음',
}

function makeComplexItem(overrides: Partial<ComparisonComplexItem> = {}): ComparisonComplexItem {
  return {
    complexId: 1,
    complexName: '테스트단지',
    completionYear: 2020,
    remodelingStatus: '해당없음',
    reconstructionStatus: '해당없음',
    nearbyRedevelopmentInfo: '재개발 정보',
    localityAttributes,
    shuttleCommuteMinutes: 15,
    priceRange: { minPrice: 90000, maxPrice: 110000, avgPrice: 100000 },
    ...overrides,
  }
}

function makeListingItem(overrides: Partial<ComparisonListingItem> = {}): ComparisonListingItem {
  return {
    listingId: 1,
    complexId: 1,
    salePrice: 95000,
    exclusiveArea: 84.5,
    complexName: '테스트단지',
    completionYear: 2020,
    remodelingStatus: '해당없음',
    reconstructionStatus: '해당없음',
    nearbyRedevelopmentInfo: '재개발 정보',
    localityAttributes,
    shuttleCommuteMinutes: 15,
    ...overrides,
  }
}

describe('calcHousingAge', () => {
  it('completionYear 2020, now 2026이면 7년차를 반환한다', () => {
    expect(calcHousingAge(2020, new Date('2026-07-09'))).toBe(7)
  })

  it('completionYear가 now와 같은 해이면 1년차를 반환한다', () => {
    expect(calcHousingAge(2026, new Date('2026-07-09'))).toBe(1)
  })
})

describe('formatPriceRange', () => {
  it("'매물 없음' 입력이면 '매물 없음'을 반환한다", () => {
    expect(formatPriceRange('매물 없음')).toBe('매물 없음')
  })

  it('가격 범위 객체이면 포맷된 범위 문자열을 반환한다', () => {
    const priceRange: PriceRangeValue = { minPrice: 90000, maxPrice: 110000, avgPrice: 100000 }
    expect(formatPriceRange(priceRange)).toBe('9억 ~ 11억')
  })
})

describe('buildComplexComparisonRows', () => {
  it('13개 행(연식/리모델링/재건축/재개발정보/7개 입지축/셔틀/단지시세)을 생성하고 각 행의 값 길이는 아이템 개수와 같다', () => {
    const items = [makeComplexItem({ complexId: 1 }), makeComplexItem({ complexId: 2 }), makeComplexItem({ complexId: 3 })]

    const rows = buildComplexComparisonRows(items)

    expect(rows).toHaveLength(13)
    const labels = rows.map((r) => r.label)
    expect(labels).toEqual([
      '연식',
      '리모델링 이력',
      '재건축 추진현황',
      '주변 재개발 정보',
      '교통',
      '상권',
      '학군',
      '강남 접근성',
      '유흥·공원',
      '개발호재',
      '주변일자리',
      '셔틀 통근시간',
      '단지 시세',
    ])
    rows.forEach((row) => expect(row.values).toHaveLength(3))
  })

  it("매물 없음인 단지의 단지 시세 행 값은 '매물 없음'이다", () => {
    const items = [makeComplexItem({ priceRange: '매물 없음' })]
    const rows = buildComplexComparisonRows(items)
    const priceRow = rows.find((r) => r.label === '단지 시세')
    expect(priceRow?.values).toEqual(['매물 없음'])
  })
})

describe('buildListingComparisonRows', () => {
  it('매매가/전용면적 행과 공용 단지축 행을 포함하고 단지시세 행은 없다', () => {
    const items = [makeListingItem({ listingId: 1 }), makeListingItem({ listingId: 2 })]

    const rows = buildListingComparisonRows(items)

    const labels = rows.map((r) => r.label)
    expect(labels[0]).toBe('매매가')
    expect(labels[1]).toBe('전용면적')
    expect(labels).toContain('연식')
    expect(labels).toContain('셔틀 통근시간')
    expect(labels).not.toContain('단지 시세')
    rows.forEach((row) => expect(row.values).toHaveLength(2))
  })
})

describe('null 값 처리 (시나리오 3-1)', () => {
  it("nearbyRedevelopmentInfo가 null이면 '정보 없음'을 표시한다", () => {
    const items = [makeComplexItem({ nearbyRedevelopmentInfo: null })]
    const rows = buildComplexComparisonRows(items)
    const row = rows.find((r) => r.label === '주변 재개발 정보')
    expect(row?.values).toEqual(['정보 없음'])
  })

  it("shuttleCommuteMinutes가 null이면 '정보 없음'을 표시한다", () => {
    const items = [makeComplexItem({ shuttleCommuteMinutes: null })]
    const rows = buildComplexComparisonRows(items)
    const row = rows.find((r) => r.label === '셔틀 통근시간')
    expect(row?.values).toEqual(['정보 없음'])
  })
})

describe('동일 단지 매물 비교 (시나리오 3-5)', () => {
  it('같은 단지의 매물이면 단지축 값은 동일하고 매매가/전용면적은 다르다', () => {
    const listingA = makeListingItem({ listingId: 1, complexId: 1, salePrice: 95000, exclusiveArea: 84.5 })
    const listingB = makeListingItem({ listingId: 2, complexId: 1, salePrice: 120000, exclusiveArea: 101.2 })

    const rows = buildListingComparisonRows([listingA, listingB])

    const priceRow = rows.find((r) => r.label === '매매가')
    const areaRow = rows.find((r) => r.label === '전용면적')
    expect(priceRow?.values[0]).not.toBe(priceRow?.values[1])
    expect(areaRow?.values[0]).not.toBe(areaRow?.values[1])

    const complexAxisLabels = ['연식', '리모델링 이력', '재건축 추진현황', '주변 재개발 정보', '교통', '셔틀 통근시간']
    complexAxisLabels.forEach((label) => {
      const row = rows.find((r) => r.label === label)
      expect(row?.values[0]).toBe(row?.values[1])
    })
  })
})
