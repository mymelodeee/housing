import { useListingAssignedSchools } from '../hooks/useListingAssignedSchools'
import type { AssignedSchool } from '../types'
import './SchoolsTab.css'

interface SchoolsTabProps {
  listingId: string
}

function SchoolRow({ label, school }: { label: string; school: AssignedSchool | null }) {
  return (
    <div className="schools-tab__row">
      <dt className="schools-tab__label">{label}</dt>
      <dd className="schools-tab__value">
        {school ? `${school.schoolName} (${school.distanceMeters.toLocaleString()}m)` : '정보 없음'}
      </dd>
    </div>
  )
}

export function SchoolsTab({ listingId }: SchoolsTabProps) {
  const { data, isLoading, isError } = useListingAssignedSchools(listingId)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">배정학교 정보를 불러오지 못했습니다.</p>

  return (
    <div className="schools-tab">
      <dl className="schools-tab__list">
        <SchoolRow label="초등학교" school={data.elementarySchool} />
        <SchoolRow label="중학교" school={data.middleSchool} />
      </dl>
      <p className="schools-tab__note">{data.assignmentNote}</p>
    </div>
  )
}
