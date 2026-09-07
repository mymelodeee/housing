import { LOCALITY_ATTRIBUTE_LABELS, LOCALITY_ATTRIBUTE_ORDER } from '../../../shared/components/LocalityAxisList'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import type { ComparisonComplexItem, ComparisonListingItem, PriceRangeValue } from '../types'

export function calcHousingAge(completionYear: number, now: Date = new Date()): number {
  return now.getFullYear() - completionYear + 1
}

export function formatPriceRange(priceRange: PriceRangeValue): string {
  if (priceRange === '매물 없음') return '매물 없음'
  return `${formatPriceKorean(priceRange.minPrice)} ~ ${formatPriceKorean(priceRange.maxPrice)}`
}

interface ComparisonRow {
  label: string
  values: string[]
}

function buildComplexAxisRows(items: (ComparisonComplexItem | ComparisonListingItem)[]): ComparisonRow[] {
  const rows: ComparisonRow[] = [
    {
      label: '연식',
      values: items.map((i) =>
        i.completionYear === null ? '정보 없음' : `${i.completionYear}년 (${calcHousingAge(i.completionYear)}년차)`,
      ),
    },
    { label: '리모델링 이력', values: items.map((i) => i.remodelingStatus) },
    { label: '재건축 추진현황', values: items.map((i) => i.reconstructionStatus) },
    { label: '주변 재개발 정보', values: items.map((i) => i.nearbyRedevelopmentInfo ?? '정보 없음') },
  ]

  for (const key of LOCALITY_ATTRIBUTE_ORDER) {
    rows.push({
      label: LOCALITY_ATTRIBUTE_LABELS[key],
      values: items.map((i) => i.localityAttributes[key]),
    })
  }

  rows.push({
    label: '셔틀 통근시간',
    values: items.map((i) => (i.shuttleCommuteMinutes !== null ? `${i.shuttleCommuteMinutes}분` : '정보 없음')),
  })

  return rows
}

export function buildComplexComparisonRows(items: ComparisonComplexItem[]): ComparisonRow[] {
  return [
    ...buildComplexAxisRows(items),
    { label: '단지 시세', values: items.map((i) => formatPriceRange(i.priceRange)) },
  ]
}

export function buildListingComparisonRows(items: ComparisonListingItem[]): ComparisonRow[] {
  return [
    { label: '매매가', values: items.map((i) => formatPriceKorean(i.salePrice)) },
    { label: '전용면적', values: items.map((i) => (i.exclusiveArea ? `${i.exclusiveArea}m²` : '전용 미상')) },
    ...buildComplexAxisRows(items),
  ]
}
