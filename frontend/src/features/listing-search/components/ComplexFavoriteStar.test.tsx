import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComplexFavoriteStar } from './ComplexFavoriteStar'

describe('ComplexFavoriteStar', () => {
  it('isFavorited가 true이면 aria-pressed는 true이고 라벨은 즐겨찾기 해제이며 별 아이콘은 ★이다', () => {
    render(<ComplexFavoriteStar isFavorited onToggle={vi.fn()} />)

    const button = screen.getByRole('button', { name: '즐겨찾기 해제' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveTextContent('★')
  })

  it('isFavorited가 false이면 aria-pressed는 false이고 라벨은 즐겨찾기 추가이며 별 아이콘은 ☆이다', () => {
    render(<ComplexFavoriteStar isFavorited={false} onToggle={vi.fn()} />)

    const button = screen.getByRole('button', { name: '즐겨찾기 추가' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveTextContent('☆')
  })

  it('클릭하면 onToggle이 호출되고 이벤트 버블링이 중단된다', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const onParentClick = vi.fn()
    render(
      <div onClick={onParentClick}>
        <ComplexFavoriteStar isFavorited={false} onToggle={onToggle} />
      </div>,
    )

    await user.click(screen.getByRole('button'))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it('disabled가 true이면 클릭해도 onToggle이 호출되지 않는다', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<ComplexFavoriteStar isFavorited onToggle={onToggle} disabled />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    await user.click(button)

    expect(onToggle).not.toHaveBeenCalled()
  })
})
