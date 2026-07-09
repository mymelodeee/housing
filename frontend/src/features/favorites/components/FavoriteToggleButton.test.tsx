import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FavoriteToggleButton } from './FavoriteToggleButton'

describe('FavoriteToggleButton', () => {
  it('isFavorited가 true이면 aria-pressed는 true이고 라벨은 즐겨찾기 해제이다', () => {
    render(<FavoriteToggleButton isFavorited onToggle={vi.fn()} />)

    const button = screen.getByRole('button', { name: '즐겨찾기 해제' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('isFavorited가 false이면 aria-pressed는 false이고 라벨은 즐겨찾기 추가이다', () => {
    render(<FavoriteToggleButton isFavorited={false} onToggle={vi.fn()} />)

    const button = screen.getByRole('button', { name: '즐겨찾기 추가' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('클릭하면 onToggle이 호출된다', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<FavoriteToggleButton isFavorited onToggle={onToggle} />)

    await user.click(screen.getByRole('button'))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('disabled가 true이면 클릭해도 onToggle이 호출되지 않는다', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<FavoriteToggleButton isFavorited onToggle={onToggle} disabled />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    await user.click(button)

    expect(onToggle).not.toHaveBeenCalled()
  })
})
