import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListingCard } from './ListingCard'
import type { Listing } from '../../../shared/types/listing'

function makeListing(overrides: Partial<Listing> = {}, complexOverrides: Partial<Listing['complex']> = {}): Listing {
  return {
    id: 1,
    complexId: 1,
    salePrice: 95000,
    exclusiveArea: 84.5,
    complex: {
      id: 1,
      complexName: '테스트단지',
      address: '서울시 테스트구 테스트동',
      completionYear: 2020,
      remodelingStatus: '해당없음',
      reconstructionStatus: '해당없음',
      isRegulatedArea: false,
      isLandTransactionPermissionZone: false,
      nearestShuttleStopName: '정류장1',
      nearestShuttleStopDistance: 100,
      shuttleCommuteMinutes: 30,
      latitude: 37.5,
      longitude: 127.0,
      ...complexOverrides,
    },
    ...overrides,
  }
}

describe('ListingCard', () => {
  it('전체 데이터가 있으면 가격/단지명/주소/면적/준공연도/셔틀 정보를 표시한다', () => {
    const listing = makeListing()
    const { container } = render(<ListingCard listing={listing} />)

    expect(screen.getByText('9억 5,000만원')).toBeInTheDocument()
    expect(screen.getByText('테스트단지')).toBeInTheDocument()
    expect(screen.getByText('서울시 테스트구 테스트동')).toBeInTheDocument()
    expect(container.textContent).toContain('84.5m²')
    expect(container.textContent).toContain('준공 2020년')
    expect(container.textContent).toContain('셔틀: 정류장1 100m')
    expect(container.textContent).toContain('통근 30분')
  })

  it('shuttleCommuteMinutes가 null이면 통근시간은 정보 없음, 셔틀 정류장 정보는 이름/거리가 있으면 그대로 표시된다', () => {
    const listing = makeListing({}, { shuttleCommuteMinutes: null })
    const { container } = render(<ListingCard listing={listing} />)

    expect(container.textContent).toContain('통근시간: 정보 없음')
    expect(container.textContent).toContain('셔틀: 정류장1 100m')
  })

  it('셔틀 정류장 이름/거리가 모두 null이면 셔틀 정류장: 정보 없음을 표시한다', () => {
    const listing = makeListing(
      {},
      { nearestShuttleStopName: null, nearestShuttleStopDistance: null, shuttleCommuteMinutes: null },
    )
    const { container } = render(<ListingCard listing={listing} />)

    expect(container.textContent).toContain('셔틀 정류장: 정보 없음')
  })

  it('exclusiveArea가 falsy(0)이면 전용 미상을 표시한다', () => {
    const listing = makeListing({ exclusiveArea: 0 })
    const { container } = render(<ListingCard listing={listing} />)

    expect(container.textContent).toContain('전용 미상')
  })

  it('onClick이 주어지면 클릭 시 listing.id로 호출된다', async () => {
    const onClick = vi.fn()
    const listing = makeListing({ id: 42 })
    const { container } = render(<ListingCard listing={listing} onClick={onClick} />)

    const card = container.querySelector('.listing-card')
    expect(card).not.toBeNull()
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClick).toHaveBeenCalledWith(42)
  })

  it('favoriteSlot이 주어지면 렌더링되고, 없으면 렌더링되지 않는다', () => {
    const listing = makeListing()
    const { rerender } = render(<ListingCard listing={listing} favoriteSlot={<span>즐겨찾기버튼</span>} />)

    expect(screen.getByText('즐겨찾기버튼')).toBeInTheDocument()

    rerender(<ListingCard listing={listing} />)

    expect(screen.queryByText('즐겨찾기버튼')).not.toBeInTheDocument()
  })
})
