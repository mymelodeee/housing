import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ComplexDetailTabs } from './ComplexDetailTabs'
import { apiClient } from '../../../shared/api/client'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(() => new Promise(() => {})),
}))
vi.mock('./ComplexOverviewTab', () => ({
  ComplexOverviewTab: ({ onRemodelingDetails }: { onRemodelingDetails?: () => void }) => (
    <button type="button" onClick={onRemodelingDetails}>리모델링 상세 보기</button>
  ),
}))

function renderTabs() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ComplexDetailTabs complexId="123" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ComplexDetailTabs', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('7개의 탭이 올바른 순서와 라벨로 렌더링되고 listingId를 쓰지 않는다', () => {
    renderTabs()

    const labels = screen.getAllByRole('tab').map((tab) => tab.textContent)
    expect(labels).toEqual(['개요', '매매가', '전세가·전세가율', '학군', '리모델링', '개발호재', '대출/자금'])
    expect(apiClient).toHaveBeenCalled()
  })

  it('초기 상태에는 개요 탭 패널만 보이고 나머지는 숨겨진다', () => {
    renderTabs()

    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    expect(panels.find((p) => p.id === 'complex-tabpanel-overview')).not.toHaveAttribute('hidden')
    expect(panels.find((p) => p.id === 'complex-tabpanel-price-history')).toHaveAttribute('hidden')
  })

  it('탭을 클릭하면 해당 패널만 보인다', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole('tab', { name: '학군' }))

    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    expect(panels.find((p) => p.id === 'complex-tabpanel-schools')).not.toHaveAttribute('hidden')
    expect(panels.find((p) => p.id === 'complex-tabpanel-overview')).toHaveAttribute('hidden')
  })

  it('개요의 리모델링 상세 버튼으로 리모델링 탭을 선택한다', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole('button', { name: '리모델링 상세 보기' }))

    expect(screen.getByRole('tab', { name: '리모델링' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: '리모델링' })).not.toHaveAttribute('hidden')
  })
})
