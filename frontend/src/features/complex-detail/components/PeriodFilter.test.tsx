import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeriodFilter } from './PeriodFilter'

describe('PeriodFilter', () => {
  it('1년/3년/전체 옵션을 렌더링한다', () => {
    render(<PeriodFilter value="all" onChange={vi.fn()} />)

    expect(screen.getByRole('option', { name: '최근 1년' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '최근 3년' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '전체' })).toBeInTheDocument()
  })

  it('옵션 선택 시 해당 값으로 onChange를 호출한다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PeriodFilter value="all" onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), '최근 1년')

    expect(onChange).toHaveBeenCalledWith('1y')
  })
})
