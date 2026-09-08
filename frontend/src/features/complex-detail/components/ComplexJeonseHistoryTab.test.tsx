import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComplexJeonseHistoryTab } from './ComplexJeonseHistoryTab'
import { useComplexJeonseHistory } from '../hooks/useComplexJeonseHistory'

vi.mock('../hooks/useComplexJeonseHistory', () => ({ useComplexJeonseHistory: vi.fn() }))

const mockedUseComplexJeonseHistory = vi.mocked(useComplexJeonseHistory)

function mockResult(data: unknown) {
  return { data, isLoading: false, isError: false } as unknown as ReturnType<typeof useComplexJeonseHistory>
}

describe('ComplexJeonseHistoryTab', () => {
  it('availableExclusiveAreas가 있으면 평형 필터를 표시하고 선택 시 해당 평형으로 재조회한다', async () => {
    const user = userEvent.setup()
    mockedUseComplexJeonseHistory.mockReturnValue(
      mockResult({
        complexId: 1,
        saleEntries: [{ transactionDate: '2025-06-01', transactionPrice: 90000, dataSource: 'x' }],
        jeonseEntries: [{ transactionDate: '2025-06-01', deposit: 60000, dataSource: 'y' }],
        ratioEntries: [{ month: '2025-06', jeonseRatioPercent: 66.7 }],
        availableExclusiveAreas: [59.95, 84.98],
        lookupWindowNote: '안내',
      })
    )

    render(<ComplexJeonseHistoryTab complexId="1" />)

    expect(screen.getByText('평형(전용면적)')).toBeInTheDocument()
    expect(screen.getByText('전세가율 66.7%')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox'), '84.98')

    expect(mockedUseComplexJeonseHistory).toHaveBeenLastCalledWith('1', 84.98)
  })

  it('평형 정보가 없으면 필터를 표시하지 않는다', () => {
    mockedUseComplexJeonseHistory.mockReturnValue(
      mockResult({
        complexId: 1,
        saleEntries: [{ transactionDate: '2025-06-01', transactionPrice: 90000, dataSource: 'x' }],
        jeonseEntries: [],
        ratioEntries: [],
        availableExclusiveAreas: [],
        lookupWindowNote: '안내',
      })
    )

    render(<ComplexJeonseHistoryTab complexId="1" />)

    expect(screen.queryByText('평형(전용면적)')).not.toBeInTheDocument()
  })

  it('데이터가 전혀 없으면 실거래 이력 없음을 표시한다', () => {
    mockedUseComplexJeonseHistory.mockReturnValue(
      mockResult({
        complexId: 1,
        saleEntries: [],
        jeonseEntries: [],
        ratioEntries: [],
        availableExclusiveAreas: [],
        lookupWindowNote: '안내',
      })
    )

    render(<ComplexJeonseHistoryTab complexId="1" />)

    expect(screen.getByText('실거래 이력 없음')).toBeInTheDocument()
  })
})
