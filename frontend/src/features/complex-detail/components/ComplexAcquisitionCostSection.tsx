import { useState } from 'react'
import { useComplexAcquisitionCosts } from '../hooks/useComplexAcquisitionCosts'
import { Badge } from '../../../shared/components/Badge'
import './ComplexAcquisitionCostSection.css'

interface ComplexAcquisitionCostSectionProps {
  complexId: string
  salePrice?: number
}

export function ComplexAcquisitionCostSection({ complexId, salePrice }: ComplexAcquisitionCostSectionProps) {
  const [exclusiveAreaInput, setExclusiveAreaInput] = useState('')
  const [homeCountInput, setHomeCountInput] = useState('')

  const exclusiveArea = exclusiveAreaInput === '' ? undefined : Number(exclusiveAreaInput)
  const homeCount = homeCountInput === '' ? undefined : Number(homeCountInput)

  const { data, isLoading, isError } = useComplexAcquisitionCosts(complexId, { salePrice, exclusiveArea, homeCount })

  return (
    <details className="complex-acquisition-cost-section">
      <summary>취득 비용 상세</summary>
      <div className="complex-acquisition-cost-section__body">
        <div className="complex-acquisition-cost-section__inputs">
          <label>
            전용면적(㎡)
            <input
              type="number"
              min={0}
              step={0.1}
              value={exclusiveAreaInput}
              onChange={(e) => setExclusiveAreaInput(e.target.value)}
              placeholder="85 이하는 농특세 없음"
            />
          </label>
          <label>
            취득 후 총 보유주택 수
            <input
              type="number"
              min={1}
              step={1}
              value={homeCountInput}
              onChange={(e) => setHomeCountInput(e.target.value)}
              placeholder="내 정보 기준 자동 추정"
            />
          </label>
        </div>

        {isLoading && <p>불러오는 중...</p>}
        {isError && <p role="alert">취득 비용 정보를 불러오지 못했습니다.</p>}
        {data && data.message && <p>{data.message}</p>}

        {data && data.effectiveSalePrice !== null && (
          <div className="complex-acquisition-cost-section__rows">
            <div className="complex-acquisition-cost-section__row">
              <span>취득세 ({data.acquisitionTax.rateLabel})</span>
              <span>{data.acquisitionTax.amount.toLocaleString()}원</span>
            </div>
            <div className="complex-acquisition-cost-section__row">
              <span>지방교육세</span>
              <span>{data.localEducationTax.amount.toLocaleString()}원</span>
            </div>
            <div className="complex-acquisition-cost-section__row">
              <span>농어촌특별세</span>
              <span>{data.ruralSpecialTax.amount.toLocaleString()}원</span>
            </div>
            <div className="complex-acquisition-cost-section__row">
              <span>
                중개보수 (법정 상한요율 {data.brokerageFee.capRatePercent}% × 취득가액) <Badge variant="needs-confirmation">ESTIMATE</Badge>
              </span>
              <span>{data.brokerageFee.amount.toLocaleString()}원</span>
            </div>
            <p className="complex-acquisition-cost-section__brokerage-note">
              법정 중개보수는 고정 금액이 아니라 상한요율을 취득가액에 곱한 값입니다. 실제 중개보수는 이 금액 이내에서 개업공인중개사와 협의해 정해집니다.
              {!data.brokerageFee.vatIncluded && ' 위 금액은 부가가치세 별도이며, 일반과세자인 개업공인중개사는 이 금액에 VAT 10%를 추가로 청구할 수 있습니다.'}
            </p>
            <div className="complex-acquisition-cost-section__row">
              <span>인지세</span>
              <span>{data.stampDuty.amount.toLocaleString()}원</span>
            </div>
            <div className="complex-acquisition-cost-section__row complex-acquisition-cost-section__row--total">
              <span>합계</span>
              <span>{data.totalCost.toLocaleString()}원</span>
            </div>
          </div>
        )}
      </div>
    </details>
  )
}
