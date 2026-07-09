import type { ReactNode } from 'react'
import type { ApartmentComplexSummary } from '../../../shared/types/listing'
import './ComplexCard.css'

interface ComplexCardProps {
  complex: ApartmentComplexSummary
  onClick?: (complexId: number) => void
  favoriteSlot?: ReactNode
}

export function ComplexCard({ complex, onClick, favoriteSlot }: ComplexCardProps) {
  return (
    <div
      className="complex-card"
      data-clickable={onClick !== undefined}
      onClick={onClick ? () => onClick(complex.id) : undefined}
    >
      <div className="complex-card__header">
        <span className="complex-card__name">{complex.complexName}</span>
        {favoriteSlot}
      </div>
      <div className="complex-card__address">{complex.address}</div>
      <div className="complex-card__meta">
        준공 {complex.completionYear}년 · 리모델링 {complex.remodelingStatus} · 재건축 {complex.reconstructionStatus}
      </div>
    </div>
  )
}
