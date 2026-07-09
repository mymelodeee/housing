import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RegulationTab } from './RegulationTab'
import { useListingRegulation } from '../hooks/useListingRegulation'

vi.mock('../hooks/useListingRegulation', () => ({
  useListingRegulation: vi.fn(),
}))

const mockedUseListingRegulation = vi.mocked(useListingRegulation)

describe('RegulationTab', () => {
  beforeEach(() => {
    mockedUseListingRegulation.mockReset()
  })

  it('로딩 중일 때 불러오는 중 텍스트를 표시한다', () => {
    mockedUseListingRegulation.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useListingRegulation>)

    render(<RegulationTab listingId="1" />)

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러일 때 alert role을 표시하고 에러를 던지지 않는다', () => {
    mockedUseListingRegulation.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as ReturnType<typeof useListingRegulation>)

    expect(() => render(<RegulationTab listingId="1" />)).not.toThrow()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('규제지역 케이스(시나리오 4-1)를 올바르게 표시한다', () => {
    mockedUseListingRegulation.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        isRegulatedArea: true,
        isLandTransactionPermissionZone: true,
        regulationConfirmationNeeded: false,
        ltvPercent: 50,
        maxLoanAmount: 60000,
        profileMessage: null,
        gapInvestmentAllowed: false,
        occupancyRequirementMonths: 6,
        regionalLoanCapAmount: 60000,
      },
    } as ReturnType<typeof useListingRegulation>)

    render(<RegulationTab listingId="1" />)

    expect(screen.getByText('규제지역')).toBeInTheDocument()
    expect(screen.getByText('토지거래허가구역')).toBeInTheDocument()
    expect(screen.getByText('60,000만원')).toBeInTheDocument()
    expect(screen.getByText('(적용 LTV 50%)')).toBeInTheDocument()
    expect(screen.getByText('갭투자 불가')).toBeInTheDocument()
    expect(screen.getByText('6개월 이내 전입 의무')).toBeInTheDocument()
    expect(screen.getByText('규제지역 주담대 상한 60,000만원')).toBeInTheDocument()

    expect(screen.queryByText('확인필요')).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        '본 금액은 규제지역 지정 확정 전 임시 산출값이며, 국토교통부 고시 확정 시 갱신됩니다',
      ),
    ).not.toBeInTheDocument()
  })

  it('평택/확인필요 케이스(시나리오 4-2)를 올바르게 표시한다', () => {
    mockedUseListingRegulation.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        isRegulatedArea: false,
        isLandTransactionPermissionZone: '확인필요',
        regulationConfirmationNeeded: true,
        ltvPercent: 70,
        maxLoanAmount: 50000,
        profileMessage: null,
        gapInvestmentAllowed: true,
        occupancyRequirementMonths: null,
        regionalLoanCapAmount: null,
      },
    } as ReturnType<typeof useListingRegulation>)

    render(<RegulationTab listingId="1" />)

    const badge = screen.getByText('확인필요')
    expect(badge).toHaveAttribute('data-variant', 'needs-confirmation')
    expect(
      screen.getByText(
        '본 금액은 규제지역 지정 확정 전 임시 산출값이며, 국토교통부 고시 확정 시 갱신됩니다',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('갭투자 가능')).toBeInTheDocument()
    expect(screen.queryByText(/개월 이내 전입 의무/)).not.toBeInTheDocument()
    expect(screen.queryByText(/규제지역 주담대 상한/)).not.toBeInTheDocument()
  })

  it('프로필 미입력 케이스에서 profileMessage를 표시하고 CTA가 없다', () => {
    mockedUseListingRegulation.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        isRegulatedArea: true,
        isLandTransactionPermissionZone: true,
        regulationConfirmationNeeded: false,
        ltvPercent: null,
        maxLoanAmount: null,
        profileMessage: '내 정보 입력 필요',
        gapInvestmentAllowed: false,
        occupancyRequirementMonths: null,
        regionalLoanCapAmount: null,
      },
    } as ReturnType<typeof useListingRegulation>)

    render(<RegulationTab listingId="1" />)

    expect(screen.getByText('내 정보 입력 필요')).toBeInTheDocument()
    expect(screen.queryByText(/만원/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
