import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LoanSimulationTab } from './LoanSimulationTab'
import { useListingLoanSimulation } from '../hooks/useListingLoanSimulation'
import type { LoanSimulationResult } from '../types'

vi.mock('../hooks/useListingLoanSimulation', () => ({
  useListingLoanSimulation: vi.fn(),
}))

const mockedUseListingLoanSimulation = vi.mocked(useListingLoanSimulation)

function renderTab(listingId = '123') {
  return render(
    <MemoryRouter initialEntries={[`/listings/${listingId}`]}>
      <Routes>
        <Route path="/listings/:listingId" element={<LoanSimulationTab listingId={listingId} />} />
        <Route path="/profile" element={<div>프로필 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function makeQueryResult(data: LoanSimulationResult | undefined, overrides: Record<string, unknown> = {}) {
  return {
    data,
    isLoading: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useListingLoanSimulation>
}

describe('LoanSimulationTab', () => {
  beforeEach(() => {
    mockedUseListingLoanSimulation.mockReset()
  })

  it('로딩 중이면 불러오는 중... 을 표시한다', () => {
    mockedUseListingLoanSimulation.mockReturnValue(
      makeQueryResult(undefined, { isLoading: true }),
    )

    renderTab()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러가 발생하면 role=alert 를 표시한다', () => {
    mockedUseListingLoanSimulation.mockReturnValue(
      makeQueryResult(undefined, { isError: true }),
    )

    renderTab()

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('profileIncomplete가 true이면 내 정보 입력 안내와 링크를 표시하고, 클릭 시 /profile로 이동한다', async () => {
    mockedUseListingLoanSimulation.mockReturnValue(
      makeQueryResult({
        listingId: 123,
        profileIncomplete: true,
        scenarios: null,
        recommendedScenario: null,
        policyMortgageNotice: 'notice',
      }),
    )

    renderTab()

    expect(screen.getByText('내 정보를 입력해주세요')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: '내 정보 입력하기' })
    expect(link).toBeInTheDocument()

    await userEvent.click(link)

    expect(screen.getByText('프로필 페이지')).toBeInTheDocument()
  })

  it('두 시나리오가 있으면 각각의 제목과 정책모기지 안내 문구를 표시한다', () => {
    mockedUseListingLoanSimulation.mockReturnValue(
      makeQueryResult({
        listingId: 123,
        profileIncomplete: false,
        scenarios: [
          {
            ownershipStructure: '단독',
            ltvPercent: 70,
            maxLoanAmount: 50000,
            requiredCapital: 20000,
            capitalSufficient: true,
            dsrUsageRate: 0.3,
            monthlyRepayment10y: 400,
            monthlyRepayment20y: 250,
            monthlyRepayment30y: 180,
            occupancyRequirementMonths: null,
            interestRatePercent: 4.5,
            interestRateSource: 'DSR 산정 기준 금리(고정)를 적용한 값입니다.',
            graduatedRepayment10y: { initialMonthlyPayment: 280, finalMonthlyPayment: 520 },
            graduatedRepayment20y: { initialMonthlyPayment: 160, finalMonthlyPayment: 340 },
            graduatedRepayment30y: { initialMonthlyPayment: 120, finalMonthlyPayment: 240 },
          },
          {
            ownershipStructure: '부부합산',
            ltvPercent: 70,
            maxLoanAmount: 70000,
            requiredCapital: 25000,
            capitalSufficient: true,
            dsrUsageRate: 0.28,
            monthlyRepayment10y: 500,
            monthlyRepayment20y: 320,
            monthlyRepayment30y: 220,
            occupancyRequirementMonths: 6,
            interestRatePercent: 4.5,
            interestRateSource: 'DSR 산정 기준 금리(고정)를 적용한 값입니다.',
            graduatedRepayment10y: { initialMonthlyPayment: 350, finalMonthlyPayment: 650 },
            graduatedRepayment20y: { initialMonthlyPayment: 200, finalMonthlyPayment: 400 },
            graduatedRepayment30y: { initialMonthlyPayment: 150, finalMonthlyPayment: 300 },
          },
        ],
        recommendedScenario: '부부합산',
        policyMortgageNotice: 'notice text',
      }),
    )

    renderTab()

    expect(screen.getByText('단독')).toBeInTheDocument()
    expect(screen.getByText('부부합산')).toBeInTheDocument()
    expect(screen.getByText('notice text')).toBeInTheDocument()
  })

  it('recommendedScenario에 해당하는 카드만 data-recommended=true 이다', () => {
    mockedUseListingLoanSimulation.mockReturnValue(
      makeQueryResult({
        listingId: 123,
        profileIncomplete: false,
        scenarios: [
          {
            ownershipStructure: '단독',
            ltvPercent: 70,
            maxLoanAmount: 50000,
            requiredCapital: 20000,
            capitalSufficient: true,
            dsrUsageRate: 0.3,
            monthlyRepayment10y: 400,
            monthlyRepayment20y: 250,
            monthlyRepayment30y: 180,
            occupancyRequirementMonths: null,
            interestRatePercent: 4.5,
            interestRateSource: 'DSR 산정 기준 금리(고정)를 적용한 값입니다.',
            graduatedRepayment10y: { initialMonthlyPayment: 280, finalMonthlyPayment: 520 },
            graduatedRepayment20y: { initialMonthlyPayment: 160, finalMonthlyPayment: 340 },
            graduatedRepayment30y: { initialMonthlyPayment: 120, finalMonthlyPayment: 240 },
          },
          {
            ownershipStructure: '부부합산',
            ltvPercent: 70,
            maxLoanAmount: 70000,
            requiredCapital: 25000,
            capitalSufficient: true,
            dsrUsageRate: 0.28,
            monthlyRepayment10y: 500,
            monthlyRepayment20y: 320,
            monthlyRepayment30y: 220,
            occupancyRequirementMonths: 6,
            interestRatePercent: 4.5,
            interestRateSource: 'DSR 산정 기준 금리(고정)를 적용한 값입니다.',
            graduatedRepayment10y: { initialMonthlyPayment: 350, finalMonthlyPayment: 650 },
            graduatedRepayment20y: { initialMonthlyPayment: 200, finalMonthlyPayment: 400 },
            graduatedRepayment30y: { initialMonthlyPayment: 150, finalMonthlyPayment: 300 },
          },
        ],
        recommendedScenario: '부부합산',
        policyMortgageNotice: 'notice text',
      }),
    )

    renderTab()

    const soleCard = screen.getByText('단독').closest('[data-recommended]')
    const jointCard = screen.getByText('부부합산').closest('[data-recommended]')

    expect(soleCard).toHaveAttribute('data-recommended', 'false')
    expect(jointCard).toHaveAttribute('data-recommended', 'true')
  })
})
