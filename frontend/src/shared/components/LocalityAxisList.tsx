import type { LocalityDisplayData } from '../types/locality'
import './LocalityAxisList.css'

export const LOCALITY_ATTRIBUTE_LABELS: Record<keyof LocalityDisplayData['localityAttributes'], string> = {
  transportation: '교통',
  commercialArea: '상권',
  schoolDistrict: '학군',
  gangnamAccessibility: '강남 접근성',
  entertainmentAndParks: '유흥·공원',
  developmentProspects: '개발호재',
  nearbyJobs: '주변일자리',
}

export const LOCALITY_ATTRIBUTE_ORDER = Object.keys(LOCALITY_ATTRIBUTE_LABELS) as Array<keyof LocalityDisplayData['localityAttributes']>

interface LocalityAxisListProps {
  data: LocalityDisplayData
}

export function LocalityAxisList({ data }: LocalityAxisListProps) {
  return (
    <dl className="locality-axis-list">
      <div className="locality-axis-list__item">
        <dt>연식</dt>
        <dd>{data.completionYear === null ? '정보 없음' : `${data.completionYear}년`}</dd>
      </div>
      <div className="locality-axis-list__item">
        <dt>리모델링 이력</dt>
        <dd>{data.remodelingStatus}</dd>
      </div>
      <div className="locality-axis-list__item">
        <dt>재건축 추진현황</dt>
        <dd>{data.reconstructionStatus}</dd>
      </div>
      <div className="locality-axis-list__item">
        <dt>주변 재개발 정보</dt>
        <dd>{data.nearbyRedevelopmentInfo ?? '정보 없음'}</dd>
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
