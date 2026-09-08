import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComplexFundingGapSection } from './ComplexFundingGapSection'
import { useComplexAcquisitionCosts } from '../hooks/useComplexAcquisitionCosts'

vi.mock('../hooks/useComplexAcquisitionCosts', () => ({ useComplexAcquisitionCosts: vi.fn() }))

const mockedHook = vi.mocked(useComplexAcquisitionCosts)

function result(overrides = {}) {
  return {
    data: {
      complexId: 1,
      effectiveSalePrice: 95000,
      salePriceSource: 'user',
      referenceTransactionDate: null,
      homeCountAfterPurchase: 1,
      exclusiveArea: 85,
      acquisitionTax: { amount: 2850000, ratePercent: 3, isHeavyTaxRate: false, rateLabel: '기본세율' },
      localEducationTax: { amount: 285000, ratePercent: 0.3 },
      ruralSpecialTax: { amount: 0, ratePercent: 0 },
      brokerageFee: { amount: 475000, appliedRatePercent: 0.5, capRatePercent: 0.5, isCapped: false, estimateType: 'ESTIMATE' },
      stampDuty: { amount: 150000 },
      totalCost: 3760000,
      ...overrides,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useComplexAcquisitionCosts>
}

describe('ComplexFundingGapSection', () => {
  beforeEach(() => {
    mockedHook.mockReset()
    mockedHook.mockReturnValue(result())
  })

  it('필요 현금과 Funding Gap을 계산해 표시한다', async () => {
    const user = userEvent.setup()
    render(<ComplexFundingGapSection complexId="1" salePrice={95000} maxLoanAmount={60000} />)

    // 필요현금 = 95000(매수가) + 376(취득비용 만원 환산) - 60000(대출) = 35376만원
    expect(screen.getByText('35,376만원')).toBeInTheDocument()

    await user.type(screen.getByLabelText('초기 현금(만원)'), '10000')

    // Funding Gap = 35376 - 10000 = 25376만원 부족
    expect(screen.getByText('25,376만원 부족')).toBeInTheDocument()
  })

  it('초기 현금이 충분하면 자금 충분을 표시한다', async () => {
    const user = userEvent.setup()
    render(<ComplexFundingGapSection complexId="1" salePrice={95000} maxLoanAmount={60000} />)

    await user.type(screen.getByLabelText('초기 현금(만원)'), '40000')

    expect(screen.getByText('자금 충분')).toBeInTheDocument()
  })
})
