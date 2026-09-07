import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecentTransactionComplexGroup } from './RecentTransactionComplexGroup'
import type { RecentTransactionGroup } from '../utils/groupRecentTransactionsByComplex'
import type { RegionalTransaction } from '../types'

function makeEntry(overrides: Partial<RegionalTransaction> = {}): RegionalTransaction {
  return {
    id: 1,
    lawdCd: '11740',
    kaptCode: null,
    complexName: '단지A',
    address: '서울 강동구 상일동 1',
    exclusiveArea: 84.5,
    salePrice: 100000,
    transactionDate: '2026-07-15',
    householdCount: 1000,
    latitude: 37.5,
    longitude: 127.1,
    collectedAt: '2026-08-17T00:00:00Z',
    ...overrides,
  }
}

function makeGroup(overrides: Partial<RecentTransactionGroup> = {}): RecentTransactionGroup {
  const entries = overrides.entries ?? [makeEntry()]
  return {
    key: '11740-단지A',
    complexName: '단지A',
    address: '서울 강동구 상일동 1',
    householdCount: 1000,
    minSalePrice: 90000,
    maxSalePrice: 110000,
    entries,
    ...overrides,
  }
}

describe('RecentTransactionComplexGroup', () => {
  it('기본 상태에서는 단지 요약 정보만 보이고 개별 매물 카드는 숨겨진다', () => {
    const { container } = render(<RecentTransactionComplexGroup group={makeGroup()} onSelect={vi.fn()} />)

    expect(screen.getByText('단지A')).toBeInTheDocument()
    expect(screen.getByText('1건')).toBeInTheDocument()
    expect(container.querySelector('.recent-transaction-group__meta')).toHaveTextContent('1000세대')
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/거래일/)).not.toBeInTheDocument()
  })

  it('최소/최대 매매가가 다르면 범위로, 같으면 단일 가격으로 표시한다', () => {
    const { container } = render(
      <RecentTransactionComplexGroup
        group={makeGroup({ minSalePrice: 90000, maxSalePrice: 90000 })}
        onSelect={vi.fn()}
      />,
    )

    expect(container.querySelector('.recent-transaction-group__meta')).toHaveTextContent('9억')
  })

  it('헤더를 클릭하면 펼쳐지고 각 매물 카드가 렌더링된다', async () => {
    const user = userEvent.setup()
    const entries = [makeEntry({ id: 1 }), makeEntry({ id: 2 })]
    render(<RecentTransactionComplexGroup group={makeGroup({ entries })} onSelect={vi.fn()} />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText(/거래일/)).toHaveLength(2)
  })

  it('펼친 상태에서 매물 카드를 클릭하면 onSelect가 해당 항목의 id로 호출된다', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const entries = [makeEntry({ id: 7 })]
    const { container } = render(<RecentTransactionComplexGroup group={makeGroup({ entries })} onSelect={onSelect} />)

    await user.click(screen.getByRole('button'))
    await user.click(container.querySelector('.listing-card') as Element)

    expect(onSelect).toHaveBeenCalledWith(7)
  })

  it('주소/세대수 정보가 없으면 안내 문구를 표시한다', () => {
    render(
      <RecentTransactionComplexGroup group={makeGroup({ address: null, householdCount: null })} onSelect={vi.fn()} />,
    )

    expect(screen.getByText('주소 정보 없음')).toBeInTheDocument()
    expect(screen.getByText(/세대수 정보 없음/)).toBeInTheDocument()
  })
})
