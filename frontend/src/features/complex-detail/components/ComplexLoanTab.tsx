import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useComplexRegulation } from '../hooks/useComplexRegulation'
import { useComplexLoanSimulation } from '../hooks/useComplexLoanSimulation'
import { Badge } from '../../../shared/components/Badge'
import { ScenarioCard } from '../../loan-simulation/components/ScenarioCard'
import { ComplexAcquisitionCostSection } from './ComplexAcquisitionCostSection'
import { ComplexHoldingTaxSection } from './ComplexHoldingTaxSection'
import { ComplexFundingGapSection } from './ComplexFundingGapSection'
import { ComplexScenarioSection } from './ComplexScenarioSection'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import '../../listing-detail/regulation/components/RegulationTab.css'
import '../../loan-simulation/components/LoanSimulationTab.css'
import './ComplexLoanTab.css'

interface ComplexLoanTabProps {
  complexId: string
}

export function ComplexLoanTab({ complexId }: ComplexLoanTabProps) {
  const [salePriceInput, setSalePriceInput] = useState('')
  const salePrice = salePriceInput === '' ? undefined : Number(salePriceInput)

  const regulation = useComplexRegulation(complexId, salePrice)
  const loanSimulation = useComplexLoanSimulation(complexId, salePrice)

  const effectiveSalePrice = regulation.data?.effectiveSalePrice ?? salePrice
  const recommendedScenario = loanSimulation.data?.scenarios?.find(
    (s) => s.ownershipStructure === loanSimulation.data?.recommendedScenario,
  )
  // recommendedScenario는 두 시나리오 모두 자금 조달이 불가능하면 null일 수 있다. 이 경우에도
  // 대출한도/금리 자체는 이미 계산돼 있으므로 첫 번째 시나리오로 대체해 Scenario·자금 섹션에 반영한다.
  const referenceScenario = recommendedScenario ?? loanSimulation.data?.scenarios?.[0]
  const maxLoanAmount = referenceScenario?.maxLoanAmount ?? regulation.data?.maxLoanAmount ?? null
  const interestRatePercent = referenceScenario?.interestRatePercent ?? null

  return (
    <div className="complex-loan-tab">
      <label className="complex-loan-tab__price-input">
        분석할 매매가(만원)
        <input
          type="number"
          min={0}
          value={salePriceInput}
          onChange={(e) => setSalePriceInput(e.target.value)}
          placeholder="비워두면 최근 실거래가 자동 적용"
        />
      </label>

      {regulation.data?.effectiveSalePrice != null && (
        <p className="complex-loan-tab__price-reference">
          {regulation.data.salePriceSource === 'transaction'
            ? `기준가격 ${formatPriceKorean(regulation.data.effectiveSalePrice)} · ${regulation.data.referenceTransactionDate} 실거래가 기준(국토교통부)`
            : `기준가격 ${formatPriceKorean(regulation.data.effectiveSalePrice)} · 직접 입력한 매매가`}
        </p>
      )}

      {regulation.isLoading && <p>불러오는 중...</p>}
      {(regulation.isError || !regulation.data) && !regulation.isLoading && (
        <p role="alert">규제/대출 정보를 불러오지 못했습니다.</p>
      )}
      {regulation.data && (
        <div className="regulation-tab">
          <div className="regulation-tab__status">
            <span>{regulation.data.isRegulatedArea ? '규제지역' : '비규제지역'}</span>
            {regulation.data.isLandTransactionPermissionZone === '확인필요' ? (
              <Badge variant="needs-confirmation">확인필요</Badge>
            ) : (
              <span>{regulation.data.isLandTransactionPermissionZone ? '토지거래허가구역' : '토지거래허가구역 아님'}</span>
            )}
          </div>

          {regulation.data.regulationConfirmationNeeded && (
            <p className="regulation-tab__notice">
              본 금액은 규제지역 지정 확정 전 임시 산출값이며, 국토교통부 고시 확정 시 갱신됩니다
            </p>
          )}

          {regulation.data.maxLoanAmount !== null ? (
            <div className="regulation-tab__loan-amount">
              <span className="regulation-tab__label">최대 대출가능금액</span>
              <span className="regulation-tab__value">{regulation.data.maxLoanAmount.toLocaleString()}만원</span>
              {regulation.data.ltvPercent !== null && (
                <span className="regulation-tab__ltv">(적용 LTV {regulation.data.ltvPercent}%)</span>
              )}
            </div>
          ) : (
            <p>{regulation.data.profileMessage}</p>
          )}

          <div className="regulation-tab__details">
            <span>{regulation.data.gapInvestmentAllowed ? '갭투자 가능' : '갭투자 불가'}</span>
            {regulation.data.occupancyRequirementMonths !== null && (
              <span>{regulation.data.occupancyRequirementMonths}개월 이내 전입 의무</span>
            )}
            {regulation.data.regionalLoanCapAmount !== null && (
              <span>규제지역 주담대 상한 {regulation.data.regionalLoanCapAmount.toLocaleString()}만원</span>
            )}
          </div>
        </div>
      )}

      <ComplexAcquisitionCostSection complexId={complexId} salePrice={effectiveSalePrice} />
      <ComplexHoldingTaxSection complexId={complexId} salePrice={effectiveSalePrice} />
      <ComplexFundingGapSection complexId={complexId} salePrice={effectiveSalePrice} maxLoanAmount={maxLoanAmount} />
      <ComplexScenarioSection
        complexId={complexId}
        salePrice={effectiveSalePrice}
        maxLoanAmount={maxLoanAmount}
        interestRatePercent={interestRatePercent}
      />

      {loanSimulation.data?.profileIncomplete && (
        <div className="loan-simulation-tab__incomplete">
          <p>내 정보를 입력해주세요</p>
          <Link to="/profile">내 정보 입력하기</Link>
        </div>
      )}

      {loanSimulation.data && !loanSimulation.data.profileIncomplete && loanSimulation.data.scenarios && (
        <div className="loan-simulation-tab">
          {loanSimulation.data.interestRateMeta && (
            <p className="loan-simulation-tab__rate-meta">
              기준금리 연 {loanSimulation.data.interestRateMeta.ratePercent}% ({loanSimulation.data.interestRateMeta.referencePeriod} 기준,{' '}
              {loanSimulation.data.interestRateMeta.checkedAt} 확인)
              {loanSimulation.data.interestRateMeta.isStale && <Badge variant="needs-confirmation">재확인 필요</Badge>}
            </p>
          )}
          <div className="loan-simulation-tab__scenarios">
            {loanSimulation.data.scenarios?.map((scenario) => (
              <ScenarioCard
                key={scenario.ownershipStructure}
                complexId={complexId}
                scenario={scenario}
                recommended={scenario.ownershipStructure === loanSimulation.data?.recommendedScenario}
              />
            ))}
          </div>
          <p className="loan-simulation-tab__notice">{loanSimulation.data.policyMortgageNotice}</p>
        </div>
      )}
    </div>
  )
}
