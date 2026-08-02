import type { ReactNode } from 'react'
import type { Listing } from '../../../shared/types/listing'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import './ListingCard.css'

interface ListingCardProps {
  listing: Listing
  onClick?: (listingId: number) => void
  favoriteSlot?: ReactNode
  compareSlot?: ReactNode
}

export function ListingCard({ listing, onClick, favoriteSlot, compareSlot }: ListingCardProps) {
  const { complex } = listing

  return (
    <div
      className="listing-card"
      data-clickable={onClick !== undefined}
      onClick={onClick ? () => onClick(listing.id) : undefined}
    >
      <div className="listing-card__header">
        <span className="listing-card__price">{formatPriceKorean(listing.salePrice)}</span>
        <div className="listing-card__actions">
          {compareSlot}
          {favoriteSlot}
        </div>
      </div>
      <div className="listing-card__complex-name">{complex.complexName}</div>
      <div className="listing-card__address">{complex.address}</div>
      <div className="listing-card__meta">
        전용 {listing.exclusiveArea ? `${listing.exclusiveArea}m²` : '전용 미상'} · 준공 {complex.completionYear}년
      </div>
      <div className="listing-card__shuttle">
        {complex.nearestShuttleStopName && complex.nearestShuttleStopDistance !== null
          ? `셔틀: ${complex.nearestShuttleStopName} ${complex.nearestShuttleStopDistance}m`
          : '셔틀 정류장: 정보 없음'}
        {' · '}
        {complex.shuttleCommuteMinutes !== null ? `통근 ${complex.shuttleCommuteMinutes}분` : '통근시간: 정보 없음'}
      </div>
    </div>
  )
}
