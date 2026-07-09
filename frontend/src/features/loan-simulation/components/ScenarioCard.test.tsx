import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScenarioCard } from './ScenarioCard'
import type { LoanScenarioResult } from '../types'

function makeScenario(overrides: Partial<LoanScenarioResult> = {}): LoanScenarioResult {
  return {
    ownershipStructure: '단독',
    ltvPercent: 70,
    maxLoanAmount: 57000,
    requiredCapital: 30000,
    capitalSufficient: true,
    dsrUsageRate: 0.325,
    monthlyRepayment10y: 500,
    monthlyRepayment20y: 300,
    monthlyRepayment30y: 200,
    occupancyRequirementMonths: null,
    ...overrides,
  }
}

describe('ScenarioCard', () => {
  it('시나리오 필드를 포맷팅하여 렌더링한다', () => {
    render(<ScenarioCard scenario={makeScenario()} recommended={false} />)

    expect(screen.getByText('단독')).toBeInTheDocument()
    expect(screen.getByText('57,000만원')).toBeInTheDocument()
    expect(screen.getByText('30,000만원')).toBeInTheDocument()
    expect(screen.getByText('32.5%')).toBeInTheDocument()
    expect(screen.getByText('500만원')).toBeInTheDocument()
    expect(screen.getByText('300만원')).toBeInTheDocument()
    expect(screen.getByText('200만원')).toBeInTheDocument()
  })

  it('occupancyRequirementMonths가 null이면 해당 없음을 표시한다', () => {
    render(<ScenarioCard scenario={makeScenario({ occupancyRequirementMonths: null })} recommended={false} />)

    expect(screen.getByText('해당 없음')).toBeInTheDocument()
  })

  it('occupancyRequirementMonths가 숫자면 n개월을 표시한다', () => {
    render(<ScenarioCard scenario={makeScenario({ occupancyRequirementMonths: 6 })} recommended={false} />)

    expect(screen.getByText('6개월')).toBeInTheDocument()
  })

  it('recommended가 true이면 추천 뱃지를 표시한다', () => {
    render(<ScenarioCard scenario={makeScenario()} recommended={true} />)

    expect(screen.getByText('추천')).toBeInTheDocument()
  })

  it('recommended가 false이면 추천 뱃지를 표시하지 않는다', () => {
    render(<ScenarioCard scenario={makeScenario()} recommended={false} />)

    expect(screen.queryByText('추천')).not.toBeInTheDocument()
  })

  it('capitalSufficient가 false이면 자금 부족 뱃지와 data-insufficient=true를 표시한다', () => {
    const { container } = render(
      <ScenarioCard scenario={makeScenario({ capitalSufficient: false })} recommended={false} />,
    )

    expect(screen.getByText('자금 부족')).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('data-insufficient', 'true')
  })

  it('capitalSufficient가 true이면 자금 부족 뱃지가 없고 data-insufficient=false이다', () => {
    const { container } = render(
      <ScenarioCard scenario={makeScenario({ capitalSufficient: true })} recommended={false} />,
    )

    expect(screen.queryByText('자금 부족')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('data-insufficient', 'false')
  })
})
