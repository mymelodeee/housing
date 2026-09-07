import { useState } from 'react'
import type { LiveListingGroup } from '../utils/groupLiveListingsByComplex'
import { LiveListingCard } from './LiveListingCard'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import './LiveListingComplexGroup.css'

interface LiveListingComplexGroupProps {
  group: LiveListingGroup
  onSelect: (cacheId: number) => void
}

export function LiveListingComplexGroup({ group, onSelect }: LiveListingComplexGroupProps) {
  const [expanded, setExpanded] = useState(false)
  const priceRangeLabel =
    group.minSalePrice === group.maxSalePrice
      ? formatPriceKorean(group.minSalePrice)
      : `${formatPriceKorean(group.minSalePrice)} ~ ${formatPriceKorean(group.maxSalePrice)}`

  return (
    <div className="live-listing-group">
      <button
        type="button"
        className="live-listing-group__header"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="live-listing-group__summary">
          <div className="live-listing-group__title-row">
            <span className="live-listing-group__complex-name">{group.complexName}</span>
            <span className="live-listing-group__count">{group.entries.length}건</span>
          </div>
          <div className="live-listing-group__address">{group.address ?? '주소 정보 없음'}</div>
          <div className="live-listing-group__meta">
            {priceRangeLabel}
            {' · '}
            {group.householdCount !== null ? `${group.householdCount}세대` : '세대수 정보 없음'}
          </div>
        </div>
        <span className="live-listing-group__chevron" data-expanded={expanded} aria-hidden="true">
          ▾
        </span>
      </button>
      {expanded && (
        <div className="live-listing-group__entries">
          {group.entries.map((entry) => (
            <LiveListingCard key={entry.id} entry={entry} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}
