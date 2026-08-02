import { useId, useState } from 'react'
import { Badge } from '../../../shared/components/Badge'
import type { GraduatedRepayment, LoanScenarioResult } from '../types'
import './ScenarioCard.css'

interface ScenarioCardProps {
  scenario: LoanScenarioResult
  recommended: boolean
}

type RepaymentMethod = 'equal' | 'graduated'

function formatGraduated(repayment: GraduatedRepayment) {
  return `초기 ${repayment.initialMonthlyPayment.toLocaleString()}만원 → 최종 ${repayment.finalMonthlyPayment.toLocaleString()}만원`
}

export function ScenarioCard({ scenario, recommended }: ScenarioCardProps) {
  const [repaymentMethod, setRepaymentMethod] = useState<RepaymentMethod>('equal')
  const groupName = useId()

  return (
    <div className="scenario-card" data-recommended={recommended} data-insufficient={!scenario.capitalSufficient}>
      <div className="scenario-card__header">
        <span className="scenario-card__title">{scenario.ownershipStructure}</span>
        {recommended && <Badge>추천</Badge>}
        {!scenario.capitalSufficient && <Badge variant="needs-confirmation">자금 부족</Badge>}
      </div>
      <div className="scenario-card__row">
        <span>최대 대출가능금액</span>
        <span className="scenario-card__value">{scenario.maxLoanAmount.toLocaleString()}만원</span>
      </div>
      <div className="scenario-card__row">
        <span>필요 자기자본</span>
        <span>{scenario.requiredCapital.toLocaleString()}만원</span>
      </div>
      <div className="scenario-card__row">
        <span>DSR 실사용률</span>
        <span>{(scenario.dsrUsageRate * 100).toFixed(1)}%</span>
      </div>
      <div className="scenario-card__row">
        <span>적용 금리</span>
        <span title={scenario.interestRateSource}>연 {scenario.interestRatePercent}%</span>
      </div>
      <p className="scenario-card__rate-source">{scenario.interestRateSource}</p>

      <div className="scenario-card__repayment-method" role="radiogroup" aria-label="상환방식">
        <label className="scenario-card__chip">
          <input
            type="radio"
            name={`repayment-method-${groupName}`}
            value="equal"
            checked={repaymentMethod === 'equal'}
            onChange={() => setRepaymentMethod('equal')}
          />
          원리금균등상환
        </label>
        <label className="scenario-card__chip">
          <input
            type="radio"
            name={`repayment-method-${groupName}`}
            value="graduated"
            checked={repaymentMethod === 'graduated'}
            onChange={() => setRepaymentMethod('graduated')}
          />
          체증식 상환
        </label>
      </div>

      {repaymentMethod === 'equal' ? (
        <>
          <div className="scenario-card__row">
            <span>10년 상환액(월)</span>
            <span>{scenario.monthlyRepayment10y.toLocaleString()}만원</span>
          </div>
          <div className="scenario-card__row">
            <span>20년 상환액(월)</span>
            <span>{scenario.monthlyRepayment20y.toLocaleString()}만원</span>
          </div>
          <div className="scenario-card__row">
            <span>30년 상환액(월)</span>
            <span>{scenario.monthlyRepayment30y.toLocaleString()}만원</span>
          </div>
        </>
      ) : (
        <>
          <div className="scenario-card__row">
            <span>10년 상환액(월)</span>
            <span>{formatGraduated(scenario.graduatedRepayment10y)}</span>
          </div>
          <div className="scenario-card__row">
            <span>20년 상환액(월)</span>
            <span>{formatGraduated(scenario.graduatedRepayment20y)}</span>
          </div>
          <div className="scenario-card__row">
            <span>30년 상환액(월)</span>
            <span>{formatGraduated(scenario.graduatedRepayment30y)}</span>
          </div>
        </>
      )}

      <div className="scenario-card__row">
        <span>실거주 의무</span>
        <span>{scenario.occupancyRequirementMonths !== null ? `${scenario.occupancyRequirementMonths}개월` : '해당 없음'}</span>
      </div>
    </div>
  )
}
