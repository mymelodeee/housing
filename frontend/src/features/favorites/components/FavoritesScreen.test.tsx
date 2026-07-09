import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FavoritesScreen } from './FavoritesScreen'

vi.mock('./FavoriteComplexesTab', () => ({
  FavoriteComplexesTab: () => <div>단지 탭 내용</div>,
}))
vi.mock('./FavoriteListingsTab', () => ({
  FavoriteListingsTab: () => <div>매물 탭 내용</div>,
}))

describe('FavoritesScreen', () => {
  it('초기 활성 탭은 단지 즐겨찾기이다', () => {
    render(<FavoritesScreen />)

    const complexesTab = screen.getByRole('tab', { name: '단지 즐겨찾기' })
    const listingsTab = screen.getByRole('tab', { name: '매물 즐겨찾기' })

    expect(complexesTab).toHaveAttribute('aria-selected', 'true')
    expect(listingsTab).toHaveAttribute('aria-selected', 'false')

    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    const complexesPanel = panels.find((p) => p.id === 'favorites-tabpanel-complexes')
    const listingsPanel = panels.find((p) => p.id === 'favorites-tabpanel-listings')

    expect(complexesPanel).not.toHaveAttribute('hidden')
    expect(listingsPanel).toHaveAttribute('hidden')
  })

  it('매물 즐겨찾기 탭 클릭 시 활성 탭과 패널 표시가 전환된다', async () => {
    const user = userEvent.setup()
    render(<FavoritesScreen />)

    await user.click(screen.getByRole('tab', { name: '매물 즐겨찾기' }))

    expect(screen.getByRole('tab', { name: '매물 즐겨찾기' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '단지 즐겨찾기' })).toHaveAttribute('aria-selected', 'false')

    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    const complexesPanel = panels.find((p) => p.id === 'favorites-tabpanel-complexes')
    const listingsPanel = panels.find((p) => p.id === 'favorites-tabpanel-listings')

    expect(listingsPanel).not.toHaveAttribute('hidden')
    expect(complexesPanel).toHaveAttribute('hidden')
  })

  it('단지 즐겨찾기 탭을 다시 클릭하면 원래 상태로 돌아온다', async () => {
    const user = userEvent.setup()
    render(<FavoritesScreen />)

    await user.click(screen.getByRole('tab', { name: '매물 즐겨찾기' }))
    await user.click(screen.getByRole('tab', { name: '단지 즐겨찾기' }))

    expect(screen.getByRole('tab', { name: '단지 즐겨찾기' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '매물 즐겨찾기' })).toHaveAttribute('aria-selected', 'false')
  })
})
