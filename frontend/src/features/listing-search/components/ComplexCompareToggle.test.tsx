import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComplexCompareToggle } from './ComplexCompareToggle'

describe('ComplexCompareToggle', () => {
  it('isSelected가 true이면 aria-pressed는 true이고 라벨은 비교셋에서 제거이다', () => {
    render(<ComplexCompareToggle isSelected onToggle={vi.fn()} />)

    const button = screen.getByRole('button', { name: '비교셋에서 제거' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('isSelected가 false이면 aria-pressed는 false이고 라벨은 비교셋에 추가이다', () => {
    render(<ComplexCompareToggle isSelected={false} onToggle={vi.fn()} />)

    const button = screen.getByRole('button', { name: '비교셋에 추가' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('클릭하면 onToggle이 호출되고 이벤트 버블링이 중단된다', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const onParentClick = vi.fn()
    render(
      <div onClick={onParentClick}>
        <ComplexCompareToggle isSelected={false} onToggle={onToggle} />
      </div>,
    )

    await user.click(screen.getByRole('button'))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it('disabled가 true이면 클릭해도 onToggle이 호출되지 않는다', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<ComplexCompareToggle isSelected onToggle={onToggle} disabled />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    await user.click(button)

    expect(onToggle).not.toHaveBeenCalled()
  })
})
