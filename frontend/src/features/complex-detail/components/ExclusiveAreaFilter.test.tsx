import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExclusiveAreaFilter } from './ExclusiveAreaFilter'

describe('ExclusiveAreaFilter', () => {
  it('전체 옵션과 평형 목록을 렌더링한다', () => {
    render(<ExclusiveAreaFilter areas={[59.95, 84.98]} value={null} onChange={vi.fn()} />)

    expect(screen.getByRole('option', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '59.95m²' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '84.98m²' })).toBeInTheDocument()
  })

  it('평형을 선택하면 숫자로 onChange를 호출한다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ExclusiveAreaFilter areas={[59.95, 84.98]} value={null} onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), '84.98')

    expect(onChange).toHaveBeenCalledWith(84.98)
  })

  it('전체를 다시 선택하면 null로 onChange를 호출한다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ExclusiveAreaFilter areas={[59.95, 84.98]} value={84.98} onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), '전체')

    expect(onChange).toHaveBeenCalledWith(null)
  })
})
