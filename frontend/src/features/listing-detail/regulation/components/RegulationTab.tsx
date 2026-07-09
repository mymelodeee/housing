import { useListingRegulation } from '../hooks/useListingRegulation'
import { Badge } from '../../../../shared/components/Badge'
import './RegulationTab.css'

interface RegulationTabProps {
  listingId: string
}

export function RegulationTab({ listingId }: RegulationTabProps) {
  const { data, isLoading, isError } = useListingRegulation(listingId)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">규제/대출 정보를 불러오지 못했습니다.</p>

  return (
    <div className="regulation-tab">
      <div className="regulation-tab__status">
        <span>{data.isRegulatedArea ? '규제지역' : '비규제지역'}</span>
        {data.isLandTransactionPermissionZone === '확인필요' ? (
          <Badge variant="needs-confirmation">확인필요</Badge>
        ) : (
          <span>{data.isLandTransactionPermissionZone ? '토지거래허가구역' : '토지거래허가구역 아님'}</span>
        )}
      </div>

      {data.regulationConfirmationNeeded && (
        <p className="regulation-tab__notice">
          본 금액은 규제지역 지정 확정 전 임시 산출값이며, 국토교통부 고시 확정 시 갱신됩니다
        </p>
      )}

      {data.maxLoanAmount !== null ? (
        <div className="regulation-tab__loan-amount">
          <span className="regulation-tab__label">최대 대출가능금액</span>
          <span className="regulation-tab__value">{data.maxLoanAmount.toLocaleString()}만원</span>
          {data.ltvPercent !== null && <span className="regulation-tab__ltv">(적용 LTV {data.ltvPercent}%)</span>}
        </div>
      ) : (
        <p>{data.profileMessage}</p>
      )}

      <div className="regulation-tab__details">
        <span>{data.gapInvestmentAllowed ? '갭투자 가능' : '갭투자 불가'}</span>
        {data.occupancyRequirementMonths !== null && (
          <span>{data.occupancyRequirementMonths}개월 이내 전입 의무</span>
        )}
        {data.regionalLoanCapAmount !== null && (
          <span>규제지역 주담대 상한 {data.regionalLoanCapAmount.toLocaleString()}만원</span>
        )}
      </div>
    </div>
  )
}
