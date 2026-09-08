import { useId, useState } from 'react'
import { Badge } from '../../../shared/components/Badge'
import { useComplexLoanSchedule } from '../../complex-detail/hooks/useComplexLoanSchedule'
import type { GraduatedRepayment, LoanScenarioResult } from '../types'
import './ScenarioCard.css'

interface ScenarioCardProps {
  scenario: LoanScenarioResult
  recommended: boolean
  complexId?: string
}

type RepaymentMethod = 'equal' | 'graduated'
type ScheduleYears = 10 | 20 | 30

const SCHEDULE_PREVIEW_MONTHS = 12

function formatGraduated(repayment: GraduatedRepayment) {
  return `초기 ${repayment.initialMonthlyPayment.toLocaleString()}만원 → 최종 ${repayment.finalMonthlyPayment.toLocaleString()}만원`
}

interface ScenarioScheduleProps {
  complexId: string
  maxLoanAmount: number
  interestRatePercent: number
}

// 별도 컴포넌트로 분리해 complexId가 없는 렌더(listing-detail의 LoanSimulationTab)에서는
// 이 컴포넌트 자체가 마운트되지 않아 useComplexLoanSchedule 훅이 호출되지 않게 한다.
function ScenarioSchedule({ complexId, maxLoanAmount, interestRatePercent }: ScenarioScheduleProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleYears, setScheduleYears] = useState<ScheduleYears>(30)
  const [graceMonthsInput, setGraceMonthsInput] = useState('0')
  const [interestRateInput, setInterestRateInput] = useState(String(interestRatePercent))

  const graceMonths = graceMonthsInput === '' ? 0 : Number(graceMonthsInput)
  const scheduleInterestRatePercent = interestRateInput === '' ? interestRatePercent : Number(interestRateInput)
  const schedule = useComplexLoanSchedule(
    complexId,
    { principal: maxLoanAmount, interestRatePercent: scheduleInterestRatePercent, graceMonths, years: scheduleYears },
    scheduleOpen,
  )

  return (
    <div className="scenario-card__schedule">
      <button type="button" className="scenario-card__schedule-toggle" onClick={() => setScheduleOpen((prev) => !prev)}>
        {scheduleOpen ? '월별 상환 스케줄 닫기' : '월별 상환 스케줄 보기'}
      </button>

      {scheduleOpen && (
        <div className="scenario-card__schedule-body">
          <div className="scenario-card__schedule-controls">
            <label>
              금리(연 %)
              <input
                type="number"
                min={0}
                step={0.1}
                value={interestRateInput}
                onChange={(e) => setInterestRateInput(e.target.value)}
              />
            </label>
            <label>
              상환기간
              <select value={scheduleYears} onChange={(e) => setScheduleYears(Number(e.target.value) as ScheduleYears)}>
                <option value={10}>10년</option>
                <option value={20}>20년</option>
                <option value={30}>30년</option>
              </select>
            </label>
            <label>
              거치기간(개월)
              <input type="number" min={0} step={1} value={graceMonthsInput} onChange={(e) => setGraceMonthsInput(e.target.value)} />
            </label>
          </div>

          {schedule.isLoading && <p>불러오는 중...</p>}
          {schedule.isError && <p role="alert">상환 스케줄을 불러오지 못했습니다.</p>}

          {schedule.data && 'message' in schedule.data && <p>{schedule.data.message}</p>}

          {schedule.data && 'rows' in schedule.data && (
            <>
              {graceMonths > 0 && (
                <div className="scenario-card__row">
                  <span>거치 종료 후 월부담 증가폭</span>
                  <span>+{Math.round(schedule.data.cliffIncrease).toLocaleString()}만원</span>
                </div>
              )}
              <div className="scenario-card__schedule-table-wrapper">
                <table className="scenario-card__schedule-table">
                  <thead>
                    <tr>
                      <th>회차</th>
                      <th>납입액</th>
                      <th>이자</th>
                      <th>원금</th>
                      <th>잔액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.data.rows.slice(0, SCHEDULE_PREVIEW_MONTHS).map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td>{Math.round(row.payment).toLocaleString()}</td>
                        <td>{Math.round(row.interest).toLocaleString()}</td>
                        <td>{Math.round(row.principal).toLocaleString()}</td>
                        <td>{Math.round(row.balance).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="scenario-card__schedule-note">
                전체 {schedule.data.rows.length}개월 중 처음 {Math.min(SCHEDULE_PREVIEW_MONTHS, schedule.data.rows.length)}개월만 표시합니다.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function ScenarioCard({ scenario, recommended, complexId }: ScenarioCardProps) {
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

      {complexId && (
        <ScenarioSchedule complexId={complexId} maxLoanAmount={scenario.maxLoanAmount} interestRatePercent={scenario.interestRatePercent} />
      )}
    </div>
  )
}
