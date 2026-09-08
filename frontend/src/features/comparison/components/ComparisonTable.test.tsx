import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComparisonComplexTable, ComparisonListingTable } from './ComparisonTable'
import type { ComparisonComplexItem, ComparisonListingItem } from '../types'
import type { LocalityAttributes } from '../../../shared/types/locality'

const localityAttributes: LocalityAttributes = {
  transportation: '좋음',
  commercialArea: '보통',
  gangnamAccessibility: '보통',
  entertainmentAndParks: '좋음',
  nearbyJobs: '좋음',
}

function makeComplexItem(overrides: Partial<ComparisonComplexItem> = {}): ComparisonComplexItem {
  return {
    complexId: 1,
    complexName: '단지A',
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
    complexName: '단지A',
    completionYear: 2020,
    remodelingStatus: '해당없음',
    reconstructionStatus: '해당없음',
    nearbyRedevelopmentInfo: '재개발 정보',
    localityAttributes,
    shuttleCommuteMinutes: 15,
    ...overrides,
  }
}

describe('ComparisonComplexTable', () => {
  it('컬럼 헤더(단지명)와 모든 행 라벨, 셀 값을 렌더링한다', () => {
    const items = [
      makeComplexItem({ complexId: 1, complexName: '단지A' }),
      makeComplexItem({ complexId: 2, complexName: '단지B' }),
      makeComplexItem({ complexId: 3, complexName: '단지C' }),
    ]

    const { container } = render(<ComparisonComplexTable items={items} />)

    expect(screen.getByText('단지A')).toBeInTheDocument()
    expect(screen.getByText('단지B')).toBeInTheDocument()
    expect(screen.getByText('단지C')).toBeInTheDocument()

    ;[
      '연식',
      '리모델링 이력',
      '재건축 추진현황',
      '주변 재개발 정보',
      '교통',
      '상권',
      '강남 접근성',
      '유흥·공원',
      '주변일자리',
      '셔틀 통근시간',
      '단지 시세',
    ].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })

    expect(container.querySelectorAll('tbody tr')).toHaveLength(11)
    expect(screen.getAllByText('9억 ~ 11억')).toHaveLength(3)
  })

  it("매물 없음인 단지의 단지시세 행에 '매물 없음' 텍스트가 렌더링된다", () => {
    const items = [makeComplexItem({ priceRange: '매물 없음' })]

    const { container } = render(<ComparisonComplexTable items={items} />)

    const rows = Array.from(container.querySelectorAll('tbody tr'))
    const priceRow = rows.find((row) => row.querySelector('th')?.textContent === '단지 시세')
    expect(priceRow).toBeDefined()
    expect(priceRow!.textContent).toContain('매물 없음')
  })
})

describe('ComparisonListingTable', () => {
  it('매물 컬럼과 매매가/전용면적 행을 렌더링한다', () => {
    const items = [
      makeListingItem({ listingId: 1, complexName: '단지A', salePrice: 95000, exclusiveArea: 84.5 }),
      makeListingItem({ listingId: 2, complexName: '단지B', salePrice: 120000, exclusiveArea: 101.2 }),
    ]

    render(<ComparisonListingTable items={items} />)

    expect(screen.getByText('단지A')).toBeInTheDocument()
    expect(screen.getByText('단지B')).toBeInTheDocument()
    expect(screen.getByText('매매가')).toBeInTheDocument()
    expect(screen.getByText('전용면적')).toBeInTheDocument()
    expect(screen.getByText('84.5m²')).toBeInTheDocument()
    expect(screen.getByText('101.2m²')).toBeInTheDocument()
  })
})
