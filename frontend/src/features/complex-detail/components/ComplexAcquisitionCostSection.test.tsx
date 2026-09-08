import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplexAcquisitionCostSection } from './ComplexAcquisitionCostSection'
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
      acquisitionTax: { amount: 28500000, ratePercent: 3, isHeavyTaxRate: false, rateLabel: '주택 유상취득 기본세율' },
      localEducationTax: { amount: 2850000, ratePercent: 0.3 },
      ruralSpecialTax: { amount: 0, ratePercent: 0 },
      brokerageFee: {
        amount: 4750000,
        appliedRatePercent: 0.5,
        capRatePercent: 0.5,
        isCapped: false,
        vatIncluded: false,
        estimateType: 'ESTIMATE',
      },
      stampDuty: { amount: 150000 },
      totalCost: 36250000,
      ...overrides,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useComplexAcquisitionCosts>
}

describe('ComplexAcquisitionCostSection', () => {
  beforeEach(() => {
    mockedHook.mockReset()
  })

  it('취득세/중개보수/인지세 breakdown과 합계를 표시한다', () => {
    mockedHook.mockReturnValue(result())

    render(<ComplexAcquisitionCostSection complexId="1" salePrice={95000} />)

    expect(screen.getByText('28,500,000원')).toBeInTheDocument()
    expect(screen.getByText('4,750,000원')).toBeInTheDocument()
    expect(screen.getByText('36,250,000원')).toBeInTheDocument()
    expect(screen.getByText('ESTIMATE')).toBeInTheDocument()
  })

  it('vatIncluded가 false이면 부가세 별도 안내 문구를 표시한다', () => {
    mockedHook.mockReturnValue(result())

    render(<ComplexAcquisitionCostSection complexId="1" salePrice={95000} />)

    expect(screen.getByText(/부가가치세 별도/)).toBeInTheDocument()
  })

  it('매매가가 없으면 안내 메시지를 표시한다', () => {
    mockedHook.mockReturnValue(result({ effectiveSalePrice: null, message: '매매가 입력 필요' }))

    render(<ComplexAcquisitionCostSection complexId="1" />)

    expect(screen.getByText('매매가 입력 필요')).toBeInTheDocument()
  })
})
