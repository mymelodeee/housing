import { Badge } from '../../../shared/components/Badge'
import type { LoanScenarioResult } from '../types'
import './ScenarioCard.css'

interface ScenarioCardProps {
  scenario: LoanScenarioResult
  recommended: boolean
}

export function ScenarioCard({ scenario, recommended }: ScenarioCardProps) {
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
      <div className="scenario-card__row">
        <span>실거주 의무</span>
        <span>{scenario.occupancyRequirementMonths !== null ? `${scenario.occupancyRequirementMonths}개월` : '해당 없음'}</span>
      </div>
    </div>
  )
}
