import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('기본 variant는 data-variant="default"로 렌더링되고 children이 보인다', () => {
    render(<Badge>기본</Badge>)

    const badge = screen.getByText('기본')
    expect(badge).toHaveAttribute('data-variant', 'default')
  })

  it('variant="needs-confirmation"이면 data-variant="needs-confirmation"으로 렌더링된다', () => {
    render(<Badge variant="needs-confirmation">확인필요</Badge>)

    const badge = screen.getByText('확인필요')
    expect(badge).toHaveAttribute('data-variant', 'needs-confirmation')
  })

  it('variant와 상관없이 children 텍스트가 올바르게 렌더링된다', () => {
    render(<Badge variant="needs-confirmation">확인필요</Badge>)
    expect(screen.getByText('확인필요')).toBeInTheDocument()
  })
})
