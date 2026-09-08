import { useState } from 'react'
import { useComplexAcquisitionCosts } from '../hooks/useComplexAcquisitionCosts'
import './ComplexFundingGapSection.css'

interface ComplexFundingGapSectionProps {
  complexId: string
  salePrice?: number
  maxLoanAmount: number | null
}

// Funding Gap은 정책 계산이 아니라 이미 알려진 숫자(매수가/취득비용/대출/초기현금)의
// 단순 산술 조합이므로 backend를 추가하지 않고 frontend에서 계산한다.
export function ComplexFundingGapSection({ complexId, salePrice, maxLoanAmount }: ComplexFundingGapSectionProps) {
  const [initialCashInput, setInitialCashInput] = useState('')
  const initialCash = initialCashInput === '' ? 0 : Number(initialCashInput)

  const { data } = useComplexAcquisitionCosts(complexId, { salePrice })

  const hasAcquisitionCost = Boolean(data && data.effectiveSalePrice !== null)
  const totalAcquisitionCostManwon = hasAcquisitionCost && data ? data.totalCost / 10000 : null

  const requiredCash =
    typeof salePrice === 'number' && totalAcquisitionCostManwon !== null
      ? salePrice + totalAcquisitionCostManwon - (maxLoanAmount ?? 0)
      : null

  const fundingGap = requiredCash !== null ? Math.max(0, requiredCash - initialCash) : null
  const isSufficient = fundingGap !== null && fundingGap <= 0

  return (
    <details className="complex-funding-gap-section">
      <summary>자금 시뮬레이션</summary>
      <div className="complex-funding-gap-section__body">
        <label className="complex-funding-gap-section__input">
          초기 현금(만원)
          <input
            type="number"
            min={0}
            value={initialCashInput}
            onChange={(e) => setInitialCashInput(e.target.value)}
            placeholder="보유 중인 현금(자기자본)"
          />
        </label>

        {requiredCash === null ? (
          <p>매매가와 취득비용을 확인할 수 없어 계산할 수 없습니다.</p>
        ) : (
          <>
            <div className="complex-funding-gap-section__row">
              <span>필요 현금(매수가+취득비용−대출)</span>
              <span>{Math.round(requiredCash).toLocaleString()}만원</span>
            </div>
            <div className="complex-funding-gap-section__row complex-funding-gap-section__row--total" data-sufficient={isSufficient}>
              <span>Funding Gap</span>
              <span>{fundingGap !== null && fundingGap > 0 ? `${Math.round(fundingGap).toLocaleString()}만원 부족` : '자금 충분'}</span>
            </div>
          </>
        )}
      </div>
    </details>
  )
}
