import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegionSelect } from './RegionSelect'

describe('RegionSelect', () => {
  it('전체 옵션과 전달된 city 목록이 렌더링된다', () => {
    render(<RegionSelect value="" cities={['화성시', '수원시']} onChange={vi.fn()} />)

    const select = screen.getByRole('combobox')
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent)
    expect(options).toEqual(['전체', '화성시', '수원시'])
  })

  it('옵션을 선택하면 onChange가 선택한 city로 호출된다', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<RegionSelect value="" cities={['화성시', '수원시']} onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), '수원시')

    expect(onChange).toHaveBeenCalledWith('수원시')
  })

  it('value가 지정되면 해당 옵션이 선택된 상태로 렌더링된다', () => {
    render(<RegionSelect value="화성시" cities={['화성시', '수원시']} onChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue('화성시')
  })
})
