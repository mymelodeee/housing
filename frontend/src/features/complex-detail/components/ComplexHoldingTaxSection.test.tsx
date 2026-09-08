import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplexHoldingTaxSection } from './ComplexHoldingTaxSection'
import { useComplexHoldingTaxEstimate } from '../hooks/useComplexHoldingTaxEstimate'

vi.mock('../hooks/useComplexHoldingTaxEstimate', () => ({ useComplexHoldingTaxEstimate: vi.fn() }))

const mockedHook = vi.mocked(useComplexHoldingTaxEstimate)

function result(overrides = {}) {
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
      propertyTax: { fairMarketValueRatio: 0.45, isSpecialOneHouse: false, propertyTax: 250000, localEducationTax: 50000, urbanAreaTax: 0, total: 300000 },
      comprehensiveTax: { deduction: 120000, taxableBase: 0, comprehensiveTax: 0, ruralSpecialTax: 0, total: 0, estimateType: 'ESTIMATE' },
      totalAnnualHoldingTax: 300000,
      ...overrides,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useComplexHoldingTaxEstimate>
}

describe('ComplexHoldingTaxSection', () => {
  beforeEach(() => {
    mockedHook.mockReset()
  })

  it('재산세/종부세 breakdown과 합계를 표시한다', () => {
    mockedHook.mockReturnValue(result())

    render(<ComplexHoldingTaxSection complexId="1" salePrice={95000} />)

    expect(screen.getByText('250,000원')).toBeInTheDocument()
    expect(screen.getByText('300,000원')).toBeInTheDocument()
    expect(screen.getByText('ESTIMATE')).toBeInTheDocument()
    expect(screen.getByText(/매매가 기준 추정값/)).toBeInTheDocument()
  })

  it('message가 있으면 안내 문구를 표시한다', () => {
    mockedHook.mockReturnValue({
      data: {
        complexId: 1,
        effectiveSalePrice: null,
        salePriceSource: null,
        referenceTransactionDate: null,
        publicPrice: null,
        publicPriceSource: null,
        message: '매매가 또는 공시가격 입력 필요',
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComplexHoldingTaxEstimate>)

    render(<ComplexHoldingTaxSection complexId="1" />)

    expect(screen.getByText('매매가 또는 공시가격 입력 필요')).toBeInTheDocument()
  })
})
