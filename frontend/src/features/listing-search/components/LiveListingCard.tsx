import type { RegionalListing } from '../types'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import './ListingCard.css'

interface LiveListingCardProps {
  entry: RegionalListing
  onSelect: (cacheId: number) => void
}

export function LiveListingCard({ entry, onSelect }: LiveListingCardProps) {
  return (
    <div className="listing-card" data-clickable="true" onClick={() => onSelect(entry.id)}>
      <div className="listing-card__header">
        <span className="listing-card__price">{formatPriceKorean(entry.salePrice)}</span>
      </div>
      <div className="listing-card__complex-name">{entry.complexName}</div>
      <div className="listing-card__address">{entry.address ?? '주소 정보 없음'}</div>
      <div className="listing-card__meta">
        전용 {entry.exclusiveArea}m² · 거래일 {entry.transactionDate}
        {' · '}
        {entry.householdCount !== null ? `${entry.householdCount}세대` : '세대수 정보 없음'}
      </div>
    </div>
  )
}
