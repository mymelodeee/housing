import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScenarioCard } from './ScenarioCard'
import { useComplexLoanSchedule } from '../../complex-detail/hooks/useComplexLoanSchedule'
import type { LoanScenarioResult } from '../types'

vi.mock('../../complex-detail/hooks/useComplexLoanSchedule', () => ({ useComplexLoanSchedule: vi.fn() }))

const mockedLoanSchedule = vi.mocked(useComplexLoanSchedule)

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
    interestRatePercent: 4.5,
    interestRateSource: 'DSR 산정 기준 금리(고정)를 적용한 값이며 실제 대출 금리와 다를 수 있습니다.',
    graduatedRepayment10y: { initialMonthlyPayment: 350, finalMonthlyPayment: 650 },
    graduatedRepayment20y: { initialMonthlyPayment: 200, finalMonthlyPayment: 400 },
    graduatedRepayment30y: { initialMonthlyPayment: 150, finalMonthlyPayment: 300 },
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

  it('적용 금리와 금리 출처 안내 문구를 표시한다', () => {
    render(<ScenarioCard scenario={makeScenario()} recommended={false} />)

    expect(screen.getByText('연 4.5%')).toBeInTheDocument()
    expect(
      screen.getByText('DSR 산정 기준 금리(고정)를 적용한 값이며 실제 대출 금리와 다를 수 있습니다.'),
    ).toBeInTheDocument()
  })

  it('기본으로 원리금균등상환 방식의 상환액을 표시한다', () => {
    render(<ScenarioCard scenario={makeScenario()} recommended={false} />)

    expect(screen.getByRole('radio', { name: '원리금균등상환' })).toBeChecked()
    expect(screen.getByText('500만원')).toBeInTheDocument()
    expect(screen.getByText('300만원')).toBeInTheDocument()
    expect(screen.getByText('200만원')).toBeInTheDocument()
  })

  it('체증식 상환을 선택하면 초기/최종 상환액을 표시한다', async () => {
    const user = userEvent.setup()
    render(<ScenarioCard scenario={makeScenario()} recommended={false} />)

    await user.click(screen.getByRole('radio', { name: '체증식 상환' }))

    expect(screen.getByText('초기 350만원 → 최종 650만원')).toBeInTheDocument()
    expect(screen.getByText('초기 200만원 → 최종 400만원')).toBeInTheDocument()
    expect(screen.getByText('초기 150만원 → 최종 300만원')).toBeInTheDocument()
    expect(screen.queryByText('500만원')).not.toBeInTheDocument()
  })

  describe('월별 상환 스케줄 (complexId 제공 시)', () => {
    beforeEach(() => {
      mockedLoanSchedule.mockReset()
    })

    it('complexId가 없으면 스케줄 버튼을 렌더링하지 않는다', () => {
      render(<ScenarioCard scenario={makeScenario()} recommended={false} />)

      expect(screen.queryByRole('button', { name: '월별 상환 스케줄 보기' })).not.toBeInTheDocument()
      expect(mockedLoanSchedule).not.toHaveBeenCalled()
    })

    it('버튼을 클릭하면 스케줄 테이블을 렌더링한다', async () => {
      mockedLoanSchedule.mockReturnValue({
        data: {
          complexId: 1,
          principal: 57000,
          interestRatePercent: 4.5,
          years: 30,
          graceMonths: 0,
          rows: [{ month: 1, payment: 289, interest: 213, principal: 76, balance: 56924 }],
          regularMonthlyPayment: 289,
          graceMonthlyPayment: 289,
          cliffMonth: 1,
          postCliffMonthlyPayment: 289,
          cliffIncrease: 0,
          totalInterest: 45000,
          totalPrincipal: 57000,
          endBalance: 0,
        },
        isLoading: false,
        isError: false,
      } as unknown as ReturnType<typeof useComplexLoanSchedule>)

      const user = userEvent.setup()
      render(<ScenarioCard scenario={makeScenario()} recommended={false} complexId="1" />)

      await user.click(screen.getByRole('button', { name: '월별 상환 스케줄 보기' }))

      expect(mockedLoanSchedule).toHaveBeenCalled()
      expect(screen.getByText('289')).toBeInTheDocument()
    })
  })
})
