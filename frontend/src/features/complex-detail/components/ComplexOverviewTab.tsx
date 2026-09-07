import { useComplex } from '../hooks/useComplex'
import { LocalityAxisList } from '../../../shared/components/LocalityAxisList'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'

interface ComplexOverviewTabProps {
  complexId: string
}

export function ComplexOverviewTab({ complexId }: ComplexOverviewTabProps) {
  const { data, isLoading, isError } = useComplex(complexId)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">단지 정보를 불러오지 못했습니다.</p>

  return (
    <div className="complex-overview-tab">
      <p>{data.address}</p>
      <p>
        {data.priceRange === '매물 없음'
          ? '실거래 기반 시세: 매물 없음'
          : `실거래 기반 시세 ${formatPriceKorean(data.priceRange.minPrice)} ~ ${formatPriceKorean(data.priceRange.maxPrice)}`}
      </p>
      <LocalityAxisList data={data} />
    </div>
  )
}
