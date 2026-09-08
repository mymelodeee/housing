import { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useComplexLoanSchedule, complexLoanScheduleQueryKey, fetchComplexLoanSchedule } from '../hooks/useComplexLoanSchedule'
import { useComplexHoldingTaxEstimate } from '../hooks/useComplexHoldingTaxEstimate'
import './ComplexScenarioSection.css'

interface ComplexScenarioSectionProps {
  complexId: string
  salePrice?: number
  maxLoanAmount: number | null
  interestRatePercent: number | null
}

type HoldingYears = 3 | 5 | 7 | 10

const SENSITIVITY_RATES = [3, 3.5, 4, 4.5, 5, 5.5, 6, 7]

interface ScenarioDefinition {
  key: 'up' | 'flat' | 'down'
  label: string
}

const SCENARIOS: ScenarioDefinition[] = [
  { key: 'up', label: '상승' },
  { key: 'flat', label: '보합' },
  { key: 'down', label: '하락' },
]

interface SensitivityTableProps {
  complexId: string
  maxLoanAmount: number
}

// 별도 컴포넌트로 분리해 "금리별 월 상환 부담 보기"를 클릭하기 전에는 이 컴포넌트 자체가
// 마운트되지 않아 useQueries(8개 병렬 조회)가 호출되지 않게 한다.
function SensitivityTable({ complexId, maxLoanAmount }: SensitivityTableProps) {
  const sensitivityQueries = useQueries({
    queries: SENSITIVITY_RATES.map((rate) => ({
      queryKey: complexLoanScheduleQueryKey(complexId, { principal: maxLoanAmount, interestRatePercent: rate, graceMonths: 0, years: 30 }),
      queryFn: () => fetchComplexLoanSchedule(complexId, { principal: maxLoanAmount, interestRatePercent: rate, graceMonths: 0, years: 30 }),
    })),
  })

  return (
    <div className="complex-scenario-section__sensitivity-table-wrapper">
      <table className="complex-scenario-section__sensitivity-table">
        <thead>
          <tr>
            <th>금리</th>
            <th>월 상환액(원리금균등, 30년)</th>
          </tr>
        </thead>
        <tbody>
          {SENSITIVITY_RATES.map((rate, index) => {
            const query = sensitivityQueries[index]
            const payment = query.data && 'regularMonthlyPayment' in query.data ? query.data.regularMonthlyPayment : null
            return (
              <tr key={rate}>
                <td>{rate}%</td>
                <td>{query.isLoading ? '계산 중...' : payment !== null ? `${Math.round(payment).toLocaleString()}만원` : '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Scenario 순자산·금리 민감도는 정책 계산이 아니라 사용자 가정(가격 변동률)과
// 이미 backend가 계산한 값(대출 스케줄·보유세)을 조합한 산술이므로 frontend에서 계산한다.
export function ComplexScenarioSection({ complexId, salePrice, maxLoanAmount, interestRatePercent }: ComplexScenarioSectionProps) {
  const [holdingYears, setHoldingYears] = useState<HoldingYears>(5)
  const [rateUpInput, setRateUpInput] = useState('4')
  const [rateFlatInput, setRateFlatInput] = useState('0')
  const [rateDownInput, setRateDownInput] = useState('-4')
  const [sensitivityOpen, setSensitivityOpen] = useState(false)

  const canCompute = typeof salePrice === 'number' && typeof maxLoanAmount === 'number' && typeof interestRatePercent === 'number'

  const schedule = useComplexLoanSchedule(
    complexId,
    { principal: maxLoanAmount ?? undefined, interestRatePercent: interestRatePercent ?? undefined, graceMonths: 0, years: 30 },
    canCompute,
  )

  const balanceAtHolding =
    schedule.data && 'rows' in schedule.data ? (schedule.data.rows[holdingYears * 12 - 1]?.balance ?? schedule.data.endBalance) : null

  const holdingTax = useComplexHoldingTaxEstimate(complexId, { salePrice }, canCompute)
  const annualHoldingTaxManwon =
    holdingTax.data && 'totalAnnualHoldingTax' in holdingTax.data ? holdingTax.data.totalAnnualHoldingTax / 10000 : 0

  const rateInputs: Record<ScenarioDefinition['key'], string> = { up: rateUpInput, flat: rateFlatInput, down: rateDownInput }
  const setRateInputs: Record<ScenarioDefinition['key'], (v: string) => void> = {
    up: setRateUpInput,
    flat: setRateFlatInput,
    down: setRateDownInput,
  }

  return (
    <details className="complex-scenario-section">
      <summary>Scenario · 민감도</summary>
      <div className="complex-scenario-section__body">
        {!canCompute && <p>매매가·대출 정보를 확인할 수 없어 계산할 수 없습니다.</p>}

        {canCompute && (
          <>
            <div className="complex-scenario-section__inputs">
              <label>
                보유기간
                <select value={holdingYears} onChange={(e) => setHoldingYears(Number(e.target.value) as HoldingYears)}>
                  <option value={3}>3년</option>
                  <option value={5}>5년</option>
                  <option value={7}>7년</option>
                  <option value={10}>10년</option>
                </select>
              </label>
              {SCENARIOS.map((s) => (
                <label key={s.key}>
                  {s.label} 연환산율(%)
                  <input
                    type="number"
                    step={0.1}
                    value={rateInputs[s.key]}
                    onChange={(e) => setRateInputs[s.key](e.target.value)}
                  />
                </label>
              ))}
            </div>

            {schedule.isLoading && <p>불러오는 중...</p>}

            {balanceAtHolding !== null && (
              <div className="complex-scenario-section__cards">
                {SCENARIOS.map((s) => {
                  const annualRate = Number(rateInputs[s.key]) / 100
                  const futureValue = (salePrice as number) * Math.pow(1 + annualRate, holdingYears)
                  const netWorth = futureValue - balanceAtHolding - annualHoldingTaxManwon * holdingYears
                  return (
                    <div className="complex-scenario-section__card" key={s.key}>
                      <div className="complex-scenario-section__card-label">{s.label}</div>
                      <div className="complex-scenario-section__card-value">{Math.round(netWorth).toLocaleString()}만원</div>
                      <p className="complex-scenario-section__card-note">
                        예상 매매가 {Math.round(futureValue).toLocaleString()}만원 − 대출잔액 {Math.round(balanceAtHolding).toLocaleString()}만원 −
                        누적 보유세(추정) {Math.round(annualHoldingTaxManwon * holdingYears).toLocaleString()}만원
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            <button type="button" className="complex-scenario-section__sensitivity-toggle" onClick={() => setSensitivityOpen((prev) => !prev)}>
              {sensitivityOpen ? '금리별 월 상환 부담 닫기' : '금리별 월 상환 부담 보기'}
            </button>

            {sensitivityOpen && <SensitivityTable complexId={complexId} maxLoanAmount={maxLoanAmount as number} />}
          </>
        )}
      </div>
    </details>
  )
}
