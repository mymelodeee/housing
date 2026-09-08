import { useState } from 'react'
import { useComplexHoldingTaxEstimate } from '../hooks/useComplexHoldingTaxEstimate'
import { Badge } from '../../../shared/components/Badge'
import './ComplexHoldingTaxSection.css'

interface ComplexHoldingTaxSectionProps {
  complexId: string
  salePrice?: number
}

export function ComplexHoldingTaxSection({ complexId, salePrice }: ComplexHoldingTaxSectionProps) {
  const [publicPriceInput, setPublicPriceInput] = useState('')
  const [includeUrbanAreaTax, setIncludeUrbanAreaTax] = useState(false)

  const publicPrice = publicPriceInput === '' ? undefined : Number(publicPriceInput)

  const { data, isLoading, isError } = useComplexHoldingTaxEstimate(complexId, { salePrice, publicPrice, includeUrbanAreaTax })

  return (
    <details className="complex-holding-tax-section">
      <summary>보유비용 추정</summary>
      <div className="complex-holding-tax-section__body">
        <p className="complex-holding-tax-section__warning">
          미확정 세법·간이 계산 기준입니다. 실제 부과세액은 공시가격 발표, 세부담상한, 세액공제 등에 따라 달라질 수 있습니다.
        </p>

        <div className="complex-holding-tax-section__inputs">
          <label>
            공시가격(만원)
            <input
              type="number"
              min={0}
              value={publicPriceInput}
              onChange={(e) => setPublicPriceInput(e.target.value)}
              placeholder="비워두면 매매가×70%로 추정"
            />
          </label>
          <label className="complex-holding-tax-section__checkbox">
            <input type="checkbox" checked={includeUrbanAreaTax} onChange={(e) => setIncludeUrbanAreaTax(e.target.checked)} />
            도시지역분(0.14%) 포함
          </label>
        </div>

        {isLoading && <p>불러오는 중...</p>}
        {isError && <p role="alert">보유비용 정보를 불러오지 못했습니다.</p>}
        {data && !('propertyTax' in data) && <p>{data.message}</p>}

        {data && 'propertyTax' in data && (
          <div className="complex-holding-tax-section__rows">
            <p className="complex-holding-tax-section__public-price-note">
              공시가격 {data.publicPrice.toLocaleString()}만원
              {data.publicPriceSource === 'estimated' ? ' (매매가 기준 추정값)' : ' (직접 입력)'}
            </p>
            <div className="complex-holding-tax-section__row">
              <span>재산세 (공정시장가액비율 {(data.propertyTax.fairMarketValueRatio * 100).toFixed(0)}%)</span>
              <span>{data.propertyTax.propertyTax.toLocaleString()}원</span>
            </div>
            <div className="complex-holding-tax-section__row">
              <span>재산세 지방교육세</span>
              <span>{data.propertyTax.localEducationTax.toLocaleString()}원</span>
            </div>
            {includeUrbanAreaTax && (
              <div className="complex-holding-tax-section__row">
                <span>도시지역분</span>
                <span>{data.propertyTax.urbanAreaTax.toLocaleString()}원</span>
              </div>
            )}
            <div className="complex-holding-tax-section__row">
              <span>
                종합부동산세(간이추정) <Badge variant="needs-confirmation">ESTIMATE</Badge>
              </span>
              <span>{data.comprehensiveTax.comprehensiveTax.toLocaleString()}원</span>
            </div>
            <div className="complex-holding-tax-section__row">
              <span>종부세 농어촌특별세</span>
              <span>{data.comprehensiveTax.ruralSpecialTax.toLocaleString()}원</span>
            </div>
            <div className="complex-holding-tax-section__row complex-holding-tax-section__row--total">
              <span>연간 보유세 합계(추정)</span>
              <span>{data.totalAnnualHoldingTax.toLocaleString()}원</span>
            </div>
          </div>
        )}
      </div>
    </details>
  )
}
