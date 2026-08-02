import { useNavigate } from 'react-router-dom'
import { useComparisonSets } from '../hooks/useComparisonSets'
import './ComparisonSetListScreen.css'

const TARGET_TYPE_LABEL = {
  complex: '단지 비교',
  listing: '매물 비교',
} as const

export function ComparisonSetListScreen() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useComparisonSets()

  if (isLoading) return <p>불러오는 중...</p>
  if (isError) return <p role="alert">비교셋 목록을 불러오지 못했습니다.</p>

  if (!data || data.length === 0) {
    return <p>생성된 비교셋이 없습니다.</p>
  }

  return (
    <div className="comparison-set-list-screen">
      {data.map((set) => (
        <div
          key={set.id}
          className="comparison-set-list-screen__card"
          onClick={() => navigate(`/comparison-sets/${set.id}`)}
        >
          <div className="comparison-set-list-screen__card-header">
            <span className="comparison-set-list-screen__target-type">
              {TARGET_TYPE_LABEL[set.targetType]}
            </span>
            <span className="comparison-set-list-screen__item-count">{set.itemCount}개</span>
          </div>
          <div className="comparison-set-list-screen__item-names">{set.itemNames.join(', ')}</div>
        </div>
      ))}
    </div>
  )
}
