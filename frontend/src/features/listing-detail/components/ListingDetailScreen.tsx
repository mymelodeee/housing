import { useParams } from 'react-router-dom'
import { ListingDetailTabs } from './ListingDetailTabs'

export function ListingDetailScreen() {
  const { listingId } = useParams<{ listingId: string }>()

  if (!listingId) {
    return <p role="alert">잘못된 접근입니다.</p>
  }

  return <ListingDetailTabs listingId={listingId} />
}
