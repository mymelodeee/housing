import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ListingDetailTabs } from './ListingDetailTabs'
import { apiClient } from '../../../shared/api/client'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(() => new Promise(() => {})),
}))

function renderTabs() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ListingDetailTabs listingId="123" />
    </QueryClientProvider>,
  )
}

describe('ListingDetailTabs', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('4개의 탭 버튼이 올바른 한글 라벨로 렌더링된다', () => {
    renderTabs()

    expect(screen.getByRole('tab', { name: '규제/대출' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '입지 정보' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '대출 시뮬레이션' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '매매가 변동 이력' })).toBeInTheDocument()
    expect(apiClient).toHaveBeenCalled()
  })

  it('초기 상태에는 규제/대출 탭 패널만 보이고 나머지는 숨겨진다', () => {
    renderTabs()

    const regulationTab = screen.getByRole('tab', { name: '규제/대출' })
    const localityTab = screen.getByRole('tab', { name: '입지 정보' })
    const loanTab = screen.getByRole('tab', { name: '대출 시뮬레이션' })
    const priceHistoryTab = screen.getByRole('tab', { name: '매매가 변동 이력' })

    expect(regulationTab).toHaveAttribute('aria-selected', 'true')
    expect(localityTab).toHaveAttribute('aria-selected', 'false')
    expect(loanTab).toHaveAttribute('aria-selected', 'false')
    expect(priceHistoryTab).toHaveAttribute('aria-selected', 'false')

    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    const regulationPanel = panels.find((p) => p.id === 'tabpanel-regulation')
    const localityPanel = panels.find((p) => p.id === 'tabpanel-locality')
    const loanPanel = panels.find((p) => p.id === 'tabpanel-loan-simulation')
    const priceHistoryPanel = panels.find((p) => p.id === 'tabpanel-price-history')

    expect(regulationPanel).not.toHaveAttribute('hidden')
    expect(localityPanel).toHaveAttribute('hidden')
    expect(loanPanel).toHaveAttribute('hidden')
    expect(priceHistoryPanel).toHaveAttribute('hidden')
  })

  it('입지 정보 탭 클릭 시 해당 패널이 보이고 규제/대출 패널은 숨겨진다', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole('tab', { name: '입지 정보' }))

    expect(screen.getByRole('tab', { name: '입지 정보' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '규제/대출' })).toHaveAttribute('aria-selected', 'false')

    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    const regulationPanel = panels.find((p) => p.id === 'tabpanel-regulation')
    const localityPanel = panels.find((p) => p.id === 'tabpanel-locality')

    expect(localityPanel).not.toHaveAttribute('hidden')
    expect(regulationPanel).toHaveAttribute('hidden')
  })

  it('매매가 변동 이력 탭 클릭 시 해당 패널이 보이고 나머지는 숨겨진다', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole('tab', { name: '매매가 변동 이력' }))

    expect(screen.getByRole('tab', { name: '매매가 변동 이력' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: '규제/대출' })).toHaveAttribute('aria-selected', 'false')

    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    const priceHistoryPanel = panels.find((p) => p.id === 'tabpanel-price-history')
    const regulationPanel = panels.find((p) => p.id === 'tabpanel-regulation')

    expect(priceHistoryPanel).not.toHaveAttribute('hidden')
    expect(regulationPanel).toHaveAttribute('hidden')
  })
})
