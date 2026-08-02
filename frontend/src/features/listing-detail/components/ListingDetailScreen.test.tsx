import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ListingDetailScreen } from './ListingDetailScreen'
import { apiClient } from '../../../shared/api/client'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(() => new Promise(() => {})),
}))

const mockedApiClient = vi.mocked(apiClient)

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

  it('매물 정보 조회가 완료되면 상단에 단지명/매매가/전용면적이 표시된다', async () => {
    mockedApiClient.mockImplementation((url: string) => {
      if (url === '/api/listings/123') {
        return Promise.resolve({
          id: 123,
          complexId: 1,
          salePrice: 95000,
          exclusiveArea: 84.98,
          complex: { id: 1, complexName: '동탄역 시범 우남퍼스트빌' },
        })
      }
      return new Promise(() => {})
    })

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

    await waitFor(() => expect(screen.getByText('동탄역 시범 우남퍼스트빌')).toBeInTheDocument())
    expect(screen.getByText('9억 5,000만원 · 전용 84.98m²')).toBeInTheDocument()
  })
})
