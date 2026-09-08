import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ComplexLoanTab } from './ComplexLoanTab'
import { useComplexRegulation } from '../hooks/useComplexRegulation'
import { useComplexLoanSimulation } from '../hooks/useComplexLoanSimulation'
import { useComplexAcquisitionCosts } from '../hooks/useComplexAcquisitionCosts'
import { useComplexLoanSchedule } from '../hooks/useComplexLoanSchedule'
import { useComplexHoldingTaxEstimate } from '../hooks/useComplexHoldingTaxEstimate'

vi.mock('../hooks/useComplexRegulation', () => ({ useComplexRegulation: vi.fn() }))
vi.mock('../hooks/useComplexLoanSimulation', () => ({ useComplexLoanSimulation: vi.fn() }))
vi.mock('../hooks/useComplexAcquisitionCosts', () => ({ useComplexAcquisitionCosts: vi.fn() }))
vi.mock('../hooks/useComplexLoanSchedule', () => ({
  useComplexLoanSchedule: vi.fn(),
  complexLoanScheduleQueryKey: (complexId: string, params: unknown) => ['complex-loan-schedule', complexId, params],
  fetchComplexLoanSchedule: vi.fn(),
}))
vi.mock('../hooks/useComplexHoldingTaxEstimate', () => ({ useComplexHoldingTaxEstimate: vi.fn() }))

const mockedRegulation = vi.mocked(useComplexRegulation)
const mockedLoanSimulation = vi.mocked(useComplexLoanSimulation)
const mockedAcquisitionCosts = vi.mocked(useComplexAcquisitionCosts)
const mockedLoanSchedule = vi.mocked(useComplexLoanSchedule)
const mockedHoldingTaxEstimate = vi.mocked(useComplexHoldingTaxEstimate)

function regulationResult(overrides = {}) {
  return {
    data: {
      complexId: 1,
      isRegulatedArea: true,
      isLandTransactionPermissionZone: true,
      regulationConfirmationNeeded: false,
      ltvPercent: null,
      maxLoanAmount: null,
      profileMessage: '매매가 입력 필요',
      effectiveSalePrice: null,
      salePriceSource: null,
      referenceTransactionDate: null,
      gapInvestmentAllowed: false,
      occupancyRequirementMonths: null,
      regionalLoanCapAmount: null,
      ...overrides,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useComplexRegulation>
}

function loanResult(overrides = {}) {
  return {
    data: {
      complexId: 1,
      profileIncomplete: false,
      scenarios: null,
      recommendedScenario: null,
      policyMortgageNotice: 'notice',
      effectiveSalePrice: null,
      salePriceSource: null,
      referenceTransactionDate: null,
      ...overrides,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useComplexLoanSimulation>
}

describe('ComplexLoanTab', () => {
  beforeEach(() => {
    mockedRegulation.mockReset()
    mockedLoanSimulation.mockReset()
    mockedAcquisitionCosts.mockReset()
    mockedLoanSchedule.mockReset()
    mockedHoldingTaxEstimate.mockReset()
    mockedRegulation.mockReturnValue(regulationResult())
    mockedLoanSimulation.mockReturnValue(loanResult({ salePriceRequired: true }))
    mockedAcquisitionCosts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplexAcquisitionCosts>)
    mockedLoanSchedule.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplexLoanSchedule>)
    mockedHoldingTaxEstimate.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplexHoldingTaxEstimate>)
  })

  it('매매가 미입력 시 profileMessage("매매가 입력 필요")를 보여주고 시나리오는 렌더링하지 않는다', () => {
    render(
      <MemoryRouter>
        <ComplexLoanTab complexId="1" />
      </MemoryRouter>,
    )

    expect(screen.getByText('매매가 입력 필요')).toBeInTheDocument()
    expect(mockedRegulation).toHaveBeenLastCalledWith('1', undefined)
    expect(mockedLoanSimulation).toHaveBeenLastCalledWith('1', undefined)
  })

  it('매매가를 입력하면 숫자로 변환해 두 훅에 전달한다', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ComplexLoanTab complexId="1" />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('분석할 매매가(만원)'), '95000')

    expect(mockedRegulation).toHaveBeenLastCalledWith('1', 95000)
    expect(mockedLoanSimulation).toHaveBeenLastCalledWith('1', 95000)
  })

  it('대출 시나리오가 있으면 카드가 렌더링된다', async () => {
    mockedLoanSimulation.mockReturnValue(
      loanResult({
        scenarios: [
          {
            ownershipStructure: '단독',
            ltvPercent: 40,
            maxLoanAmount: 38000,
            requiredCapital: 57000,
            capitalSufficient: true,
            dsrUsageRate: 0.3,
            monthlyRepayment10y: 100,
            monthlyRepayment20y: 60,
            monthlyRepayment30y: 45,
            occupancyRequirementMonths: null,
            interestRatePercent: 4.5,
            interestRateSource: 'source',
            graduatedRepayment10y: { initialMonthlyPayment: 80, finalMonthlyPayment: 120 },
            graduatedRepayment20y: { initialMonthlyPayment: 50, finalMonthlyPayment: 70 },
            graduatedRepayment30y: { initialMonthlyPayment: 40, finalMonthlyPayment: 50 },
          },
        ],
        recommendedScenario: '단독',
      }),
    )
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ComplexLoanTab complexId="1" />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('분석할 매매가(만원)'), '95000')

    expect(screen.getByText('단독')).toBeInTheDocument()
  })

  it('salePrice 미입력 시 최신 실거래가 자동 적용되면 기준가격과 거래일을 표시하고 시나리오를 바로 렌더링한다', () => {
    mockedRegulation.mockReturnValue(
      regulationResult({
        profileMessage: null,
        maxLoanAmount: 38000,
        ltvPercent: 40,
        effectiveSalePrice: 95000,
        salePriceSource: 'transaction',
        referenceTransactionDate: '2026-08-25',
      }),
    )
    mockedLoanSimulation.mockReturnValue(
      loanResult({
        effectiveSalePrice: 95000,
        salePriceSource: 'transaction',
        referenceTransactionDate: '2026-08-25',
        scenarios: [
          {
            ownershipStructure: '단독',
            ltvPercent: 40,
            maxLoanAmount: 38000,
            requiredCapital: 57000,
            capitalSufficient: true,
            dsrUsageRate: 0.3,
            monthlyRepayment10y: 100,
            monthlyRepayment20y: 60,
            monthlyRepayment30y: 45,
            occupancyRequirementMonths: null,
            interestRatePercent: 4.5,
            interestRateSource: 'source',
            graduatedRepayment10y: { initialMonthlyPayment: 80, finalMonthlyPayment: 120 },
            graduatedRepayment20y: { initialMonthlyPayment: 50, finalMonthlyPayment: 70 },
            graduatedRepayment30y: { initialMonthlyPayment: 40, finalMonthlyPayment: 50 },
          },
        ],
        recommendedScenario: '단독',
      }),
    )

    render(
      <MemoryRouter>
        <ComplexLoanTab complexId="1" />
      </MemoryRouter>,
    )

    expect(screen.getByText(/기준가격 9억 5,000만원 · 2026-08-25 실거래가 기준\(국토교통부\)/)).toBeInTheDocument()
    expect(screen.getByText('단독')).toBeInTheDocument()
    expect(mockedRegulation).toHaveBeenLastCalledWith('1', undefined)
  })

  it('사용자가 직접 입력한 매매가는 실거래가 아님을 구분해 표시한다', () => {
    mockedRegulation.mockReturnValue(
      regulationResult({
        profileMessage: null,
        maxLoanAmount: 38000,
        ltvPercent: 40,
        effectiveSalePrice: 100000,
        salePriceSource: 'user',
        referenceTransactionDate: null,
      }),
    )

    render(
      <MemoryRouter>
        <ComplexLoanTab complexId="1" />
      </MemoryRouter>,
    )

    expect(screen.getByText(/기준가격 10억 · 직접 입력한 매매가/)).toBeInTheDocument()
  })
})
