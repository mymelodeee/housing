import { useListingLocality } from '../hooks/useListingLocality'
import { LocalityAxisList } from '../../../../shared/components/LocalityAxisList'

interface LocalityTabProps {
  listingId: string
}

export function LocalityTab({ listingId }: LocalityTabProps) {
  const { data, isLoading, isError } = useListingLocality(listingId)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">입지 정보를 불러오지 못했습니다.</p>

  return <LocalityAxisList data={data} />
}
