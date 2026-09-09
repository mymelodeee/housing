import type { LocalityDisplayData } from '../types/locality'
import { calcHousingAge } from '../utils/housingAge'
import './LocalityAxisList.css'

// 학군/개발호재는 각각 전용 탭(단지 상세 "학군"/"개발호재")으로 대체돼 완전 중복이라
// 2026-09-08 제거했다(docs/search-architecture-refactor-plan.md §6/§18).
export const LOCALITY_ATTRIBUTE_LABELS: Record<keyof LocalityDisplayData['localityAttributes'], string> = {
  transportation: '교통',
  commercialArea: '상권',
  gangnamAccessibility: '강남 접근성',
  entertainmentAndParks: '유흥·공원',
  nearbyJobs: '주변일자리',
}

export const LOCALITY_ATTRIBUTE_ORDER = Object.keys(LOCALITY_ATTRIBUTE_LABELS) as Array<keyof LocalityDisplayData['localityAttributes']>

interface LocalityAxisListProps {
  data: LocalityDisplayData
  remodelingDisplay?: {
    value: string
    onDetails?: () => void
  }
}

export function LocalityAxisList({ data, remodelingDisplay }: LocalityAxisListProps) {
  return (
    <dl className="locality-axis-list">
      <div className="locality-axis-list__item">
        <dt>연식</dt>
        <dd>{data.completionYear === null ? '확인 필요' : `${data.completionYear}년 (${calcHousingAge(data.completionYear)}년차)`}</dd>
      </div>
      <div className="locality-axis-list__item">
        <dt>{remodelingDisplay ? '리모델링 추진 여부' : '리모델링 이력'}</dt>
        <dd className="locality-axis-list__value-with-action">
          <span>{remodelingDisplay?.value ?? data.remodelingStatus}</span>
          {remodelingDisplay?.onDetails && (
            <button
              type="button"
              className="locality-axis-list__details-button"
              aria-label="리모델링 상세 보기"
              title="리모델링 상세 보기"
              onClick={remodelingDisplay.onDetails}
            >
              <span aria-hidden="true">›</span>
            </button>
          )}
        </dd>
      </div>
      <div className="locality-axis-list__item">
        <dt>재건축 추진현황</dt>
        <dd>{data.reconstructionStatus}</dd>
      </div>
      <div className="locality-axis-list__item">
        <dt>주변 재개발 정보</dt>
        <dd>{data.nearbyRedevelopmentInfo ?? '확인 필요'}</dd>
      </div>
      {LOCALITY_ATTRIBUTE_ORDER.map((key) => (
        <div className="locality-axis-list__item" key={key}>
          <dt>{LOCALITY_ATTRIBUTE_LABELS[key]}</dt>
          <dd>{data.localityAttributes[key]}</dd>
        </div>
      ))}
    </dl>
  )
}
