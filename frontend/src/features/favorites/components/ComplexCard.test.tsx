import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplexCard } from './ComplexCard'
import type { ApartmentComplexSummary } from '../../../shared/types/listing'

function makeComplex(overrides: Partial<ApartmentComplexSummary> = {}): ApartmentComplexSummary {
  return {
    id: 1,
    complexName: '테스트단지',
    address: '서울시 테스트구',
    completionYear: 2020,
    remodelingStatus: '해당없음',
    reconstructionStatus: '해당없음',
    isRegulatedArea: false,
    isLandTransactionPermissionZone: false,
    nearestShuttleStopName: '정류장1',
    nearestShuttleStopDistance: 100,
    shuttleCommuteMinutes: 30,
    ...overrides,
  }
}

describe('ComplexCard', () => {
  it('단지명, 주소, 준공연도, 리모델링/재건축 상태를 표시한다', () => {
    const complex = makeComplex()
    const { container } = render(<ComplexCard complex={complex} />)

    expect(screen.getByText('테스트단지')).toBeInTheDocument()
    expect(screen.getByText('서울시 테스트구')).toBeInTheDocument()
    expect(container.textContent).toContain('준공 2020년')
    expect(container.textContent).toContain('리모델링 해당없음')
    expect(container.textContent).toContain('재건축 해당없음')
  })

  it('onClick이 주어지면 클릭 시 complex.id로 호출된다', () => {
    const onClick = vi.fn()
    const complex = makeComplex({ id: 42 })
    const { container } = render(<ComplexCard complex={complex} onClick={onClick} />)

    const card = container.querySelector('.complex-card')
    expect(card).not.toBeNull()
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClick).toHaveBeenCalledWith(42)
  })

  it('favoriteSlot이 주어지면 렌더링되고, 없으면 렌더링되지 않는다', () => {
    const complex = makeComplex()
    const { rerender } = render(<ComplexCard complex={complex} favoriteSlot={<span>즐겨찾기버튼</span>} />)

    expect(screen.getByText('즐겨찾기버튼')).toBeInTheDocument()

    rerender(<ComplexCard complex={complex} />)

    expect(screen.queryByText('즐겨찾기버튼')).not.toBeInTheDocument()
  })
})
