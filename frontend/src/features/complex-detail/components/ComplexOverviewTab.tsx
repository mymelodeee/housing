import { useComplex } from '../hooks/useComplex'
import { useComplexRemodeling } from '../hooks/useComplexRemodeling'
import { LocalityAxisList } from '../../../shared/components/LocalityAxisList'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'

interface ComplexOverviewTabProps {
  complexId: string
  onRemodelingDetails?: () => void
}

export function ComplexOverviewTab({ complexId, onRemodelingDetails }: ComplexOverviewTabProps) {
  const { data, isLoading, isError } = useComplex(complexId)
  const remodelingQuery = useComplexRemodeling(complexId)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">단지 정보를 불러오지 못했습니다.</p>

  const currentStage = remodelingQuery.data?.hasProject ? remodelingQuery.data.currentStage : null
  const remodelingValue = remodelingQuery.isLoading
    ? '확인 중...'
    : remodelingQuery.isError
      ? '정보 확인 필요'
      : currentStage?.value ?? '해당없음'

  return (
    <div className="complex-overview-tab">
      <p>{data.address}</p>
      <p>
        {data.priceRange === '매물 없음'
          ? '실거래 기반 시세: 매물 없음'
          : `실거래 기반 시세 ${formatPriceKorean(data.priceRange.minPrice)} ~ ${formatPriceKorean(data.priceRange.maxPrice)}`}
      </p>
      <p>
        {data.householdCount === null ? '세대수 확인필요' : `${data.householdCount.toLocaleString()}세대`}
        {' · '}
        {data.buildingCount === null ? '동수 확인필요' : `${data.buildingCount}개동`}
      </p>
      <LocalityAxisList
        data={data}
        remodelingDisplay={{
          value: remodelingValue,
          onDetails: currentStage && onRemodelingDetails ? onRemodelingDetails : undefined,
        }}
      />
    </div>
  )
}
