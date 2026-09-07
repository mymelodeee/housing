import type { ReactNode } from 'react'
import type { ListingComplex } from '../../../shared/types/listing'
import './ComplexLocationCard.css'

interface ComplexLocationCardProps {
  complex: ListingComplex
  favoriteSlot?: ReactNode
  compareSlot?: ReactNode
  onClick?: () => void
}

export function ComplexLocationCard({ complex, favoriteSlot, compareSlot, onClick }: ComplexLocationCardProps) {
  return (
    <div className="complex-location-card" data-clickable={Boolean(onClick)} onClick={onClick}>
      <div className="complex-location-card__header">
        <span className="complex-location-card__complex-name">{complex.complexName}</span>
        <div className="complex-location-card__actions">
          {compareSlot}
          {favoriteSlot}
        </div>
      </div>
      <div className="complex-location-card__address">{complex.address}</div>
      <div className="complex-location-card__meta">준공 {complex.completionYear}년</div>
    </div>
  )
}
