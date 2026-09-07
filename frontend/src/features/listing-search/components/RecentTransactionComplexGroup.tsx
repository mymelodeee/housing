import { useState } from 'react'
import type { RecentTransactionGroup } from '../utils/groupRecentTransactionsByComplex'
import { RecentTransactionCard } from './RecentTransactionCard'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import './RecentTransactionComplexGroup.css'

interface RecentTransactionComplexGroupProps {
  group: RecentTransactionGroup
  onSelect: (cacheId: number) => void
}

export function RecentTransactionComplexGroup({ group, onSelect }: RecentTransactionComplexGroupProps) {
  const [expanded, setExpanded] = useState(false)
  const priceRangeLabel =
    group.minSalePrice === group.maxSalePrice
      ? formatPriceKorean(group.minSalePrice)
      : `${formatPriceKorean(group.minSalePrice)} ~ ${formatPriceKorean(group.maxSalePrice)}`

  return (
    <div className="recent-transaction-group">
      <button
        type="button"
        className="recent-transaction-group__header"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="recent-transaction-group__summary">
          <div className="recent-transaction-group__title-row">
            <span className="recent-transaction-group__complex-name">{group.complexName}</span>
            <span className="recent-transaction-group__count">{group.entries.length}건</span>
          </div>
          <div className="recent-transaction-group__address">{group.address ?? '주소 정보 없음'}</div>
          <div className="recent-transaction-group__meta">
            {priceRangeLabel}
            {' · '}
            {group.householdCount !== null ? `${group.householdCount}세대` : '세대수 정보 없음'}
          </div>
        </div>
        <span className="recent-transaction-group__chevron" data-expanded={expanded} aria-hidden="true">
          ▾
        </span>
      </button>
      {expanded && (
        <div className="recent-transaction-group__entries">
          {group.entries.map((entry) => (
            <RecentTransactionCard key={entry.id} entry={entry} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}
