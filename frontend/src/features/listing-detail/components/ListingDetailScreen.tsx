import { Link, useParams } from 'react-router-dom'
import { useListing } from '../hooks/useListing'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import { ListingDetailTabs } from './ListingDetailTabs'
import './ListingDetailScreen.css'

export function ListingDetailScreen() {
  const { listingId } = useParams<{ listingId: string }>()
  const { data: listing } = useListing(listingId ?? '')

  if (!listingId) {
    return <p role="alert">잘못된 접근입니다.</p>
  }

  return (
    <div className="listing-detail-screen">
      <Link to="/" className="listing-detail-screen__back-link">
        ← 목록으로
      </Link>
      {listing && (
        <h1 className="listing-detail-screen__header">
          <span className="listing-detail-screen__complex-name">{listing.complex.complexName}</span>
          <span className="listing-detail-screen__meta">
            {formatPriceKorean(listing.salePrice)} · 전용 {listing.exclusiveArea}m²
          </span>
        </h1>
      )}
      <ListingDetailTabs listingId={listingId} />
    </div>
  )
}
