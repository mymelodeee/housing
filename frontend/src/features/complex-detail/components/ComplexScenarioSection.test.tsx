import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ComplexScenarioSection } from './ComplexScenarioSection'
import { useComplexLoanSchedule, fetchComplexLoanSchedule } from '../hooks/useComplexLoanSchedule'
import { useComplexHoldingTaxEstimate } from '../hooks/useComplexHoldingTaxEstimate'

vi.mock('../hooks/useComplexLoanSchedule', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useComplexLoanSchedule')>()
  return { ...actual, useComplexLoanSchedule: vi.fn(), fetchComplexLoanSchedule: vi.fn() }
})
vi.mock('../hooks/useComplexHoldingTaxEstimate', () => ({ useComplexHoldingTaxEstimate: vi.fn() }))

const mockedSchedule = vi.mocked(useComplexLoanSchedule)
const mockedHoldingTax = vi.mocked(useComplexHoldingTaxEstimate)
const mockedFetchSchedule = vi.mocked(fetchComplexLoanSchedule)

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function scheduleResult() {
  const rows = Array.from({ length: 360 }, (_, i) => ({
    month: i + 1,
    payment: 300,
    interest: 200,
    principal: 100,
    balance: 60000 - i * 100,
  }))
  return {
    data: {
      complexId: 1,
      principal: 60000,
      interestRatePercent: 4.5,
      years: 30,
      graceMonths: 0,
      rows,
      regularMonthlyPayment: 300,
      graceMonthlyPayment: 300,
      cliffMonth: 1,
      postCliffMonthlyPayment: 300,
      cliffIncrease: 0,
      totalInterest: 40000,
      totalPrincipal: 60000,
      endBalance: 0,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useComplexLoanSchedule>
}

function holdingTaxResult() {
  return {
    data: {
      complexId: 1,
      effectiveSalePrice: 95000,
      salePriceSource: 'user',
      referenceTransactionDate: null,
      publicPrice: 66500,
      publicPriceSource: 'estimated',
      homeCountAfterPurchase: 1,
      isOneHouse: true,
      propertyTax: { fairMarketValueRatio: 0.45, isSpecialOneHouse: false, propertyTax: 100000, localEducationTax: 20000, urbanAreaTax: 0, total: 120000 },
      comprehensiveTax: { deduction: 120000, taxableBase: 0, comprehensiveTax: 0, ruralSpecialTax: 0, total: 0, estimateType: 'ESTIMATE' },
      totalAnnualHoldingTax: 120000,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useComplexHoldingTaxEstimate>
}

describe('ComplexScenarioSection', () => {
  beforeEach(() => {
    mockedSchedule.mockReset()
    mockedHoldingTax.mockReset()
    mockedFetchSchedule.mockReset()
    mockedSchedule.mockReturnValue(scheduleResult())
    mockedHoldingTax.mockReturnValue(holdingTaxResult())
  })

  it('매매가/대출/금리 정보가 없으면 계산 불가 안내를 표시한다', () => {
    renderWithClient(<ComplexScenarioSection complexId="1" maxLoanAmount={null} interestRatePercent={null} />)

    expect(screen.getByText('매매가·대출 정보를 확인할 수 없어 계산할 수 없습니다.')).toBeInTheDocument()
  })

  it('상승/보합/하락 3개 시나리오 카드를 렌더링한다', () => {
    renderWithClient(<ComplexScenarioSection complexId="1" salePrice={95000} maxLoanAmount={60000} interestRatePercent={4.5} />)

    expect(screen.getByText('상승')).toBeInTheDocument()
    expect(screen.getByText('보합')).toBeInTheDocument()
    expect(screen.getByText('하락')).toBeInTheDocument()
  })

  it('금리별 월 상환 부담 버튼을 누르기 전에는 sensitivity 훅을 호출하지 않는다', () => {
    renderWithClient(<ComplexScenarioSection complexId="1" salePrice={95000} maxLoanAmount={60000} interestRatePercent={4.5} />)

    expect(screen.queryByText('금리')).not.toBeInTheDocument()
    expect(mockedFetchSchedule).not.toHaveBeenCalled()
  })

  it('버튼을 클릭하면 금리별 민감도 표를 렌더링한다', async () => {
    mockedFetchSchedule.mockResolvedValue(scheduleResult().data!)
    const user = userEvent.setup()
    renderWithClient(<ComplexScenarioSection complexId="1" salePrice={95000} maxLoanAmount={60000} interestRatePercent={4.5} />)

    await user.click(screen.getByRole('button', { name: '금리별 월 상환 부담 보기' }))

    expect(screen.getByText('금리')).toBeInTheDocument()
  })
})
