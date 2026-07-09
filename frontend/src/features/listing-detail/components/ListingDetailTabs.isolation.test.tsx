import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ListingDetailTabs } from './ListingDetailTabs'

vi.mock('../regulation/components/RegulationTab', () => ({
  RegulationTab: () => {
    throw new Error('regulation tab crashed')
  },
}))

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(() => new Promise(() => {})),
}))

describe('ListingDetailTabs - 탭 에러 격리', () => {
  it('규제/대출 탭이 렌더링 중 에러가 나도 다른 탭 버튼은 정상 동작한다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ListingDetailTabs listingId="123" />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('일시적인 오류가 발생했습니다.')

    expect(screen.getByRole('tab', { name: '규제/대출' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '입지 정보' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '대출 시뮬레이션' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '매매가 변동 이력' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '입지 정보' }))

    expect(screen.getByRole('tab', { name: '입지 정보' })).toHaveAttribute('aria-selected', 'true')
    const localityPanel = screen.getByRole('tabpanel', { name: '입지 정보' })
    expect(localityPanel).not.toHaveAttribute('hidden')
    expect(localityPanel).toHaveTextContent('불러오는 중...')

    vi.restoreAllMocks()
  })
})
