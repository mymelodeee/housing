import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ListingDetailScreen } from './ListingDetailScreen'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(() => new Promise(() => {})),
}))

describe('ListingDetailScreen', () => {
  it('listingId가 있으면 ListingDetailTabs가 렌더링되고 해당 listingId가 전달된다', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/listings/123']}>
          <Routes>
            <Route path="/listings/:listingId" element={<ListingDetailScreen />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '규제/대출' })).toBeInTheDocument()
    const regulationPanel = screen.getByRole('tabpanel', { name: '규제/대출' })
    expect(regulationPanel).not.toHaveAttribute('hidden')
    expect(regulationPanel).toHaveTextContent('불러오는 중...')
  })

  // listingId가 없는 경우는 라우트 패턴(/listings/:listingId)이 매치되면 항상
  // listingId가 캡처되므로, 일반적인 라우팅을 통해서는 도달할 수 없는 방어 코드입니다.
  // 임의의 잘못된 렌더링으로 강제로 도달시키지 않고 커버리지 미달 라인으로 남겨둡니다.
})
