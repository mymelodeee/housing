import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { PriceRangeFilter } from './PriceRangeFilter'

function ControlledHarness({
  onChange,
  initialMin = 70000,
  initialMax = 150000,
}: {
  onChange: (range: { minPrice: number; maxPrice: number }) => void
  initialMin?: number
  initialMax?: number
}) {
  const [range, setRange] = useState({ minPrice: initialMin, maxPrice: initialMax })
  return (
    <PriceRangeFilter
      minPrice={range.minPrice}
      maxPrice={range.maxPrice}
      onChange={(next) => {
        setRange(next)
        onChange(next)
      }}
    />
  )
}

describe('PriceRangeFilter', () => {
  it('minPrice, maxPrice 값으로 두 입력란을 렌더링한다', () => {
    render(<PriceRangeFilter minPrice={70000} maxPrice={150000} onChange={vi.fn()} />)

    expect(screen.getByLabelText('최소 매매가(만원)')).toHaveValue(70000)
    expect(screen.getByLabelText('최대 매매가(만원)')).toHaveValue(150000)
  })

  it('최소 매매가 입력을 변경하면 갱신된 minPrice와 기존 maxPrice로 onChange를 호출한다', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ControlledHarness onChange={onChange} />)

    const minInput = screen.getByLabelText('최소 매매가(만원)')
    await user.clear(minInput)
    await user.type(minInput, '80000')

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toEqual({ minPrice: 80000, maxPrice: 150000 })
  })

  it('최대 매매가 입력을 변경하면 갱신된 maxPrice와 기존 minPrice로 onChange를 호출한다', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ControlledHarness onChange={onChange} />)

    const maxInput = screen.getByLabelText('최대 매매가(만원)')
    await user.clear(maxInput)
    await user.type(maxInput, '120000')

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toEqual({ minPrice: 70000, maxPrice: 120000 })
  })
})
