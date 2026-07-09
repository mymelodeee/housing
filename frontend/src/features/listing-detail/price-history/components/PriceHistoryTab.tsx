import { useListingPriceHistory } from '../hooks/useListingPriceHistory'
import { PriceHistoryChart } from './PriceHistoryChart'
import { PriceHistoryTable } from './PriceHistoryTable'
import './PriceHistoryTab.css'

interface PriceHistoryTabProps {
  listingId: string
}

export function PriceHistoryTab({ listingId }: PriceHistoryTabProps) {
  const { data, isLoading, isError } = useListingPriceHistory(listingId)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">매매가 변동 이력을 불러오지 못했습니다.</p>
  if (data.entries.length === 0) return <p>실거래 이력 없음</p>

  return (
    <div className="price-history-tab">
      {data.lookupPeriodType === '최초거래 이후' && data.firstTransactionMonth && (
        <p className="price-history-tab__notice">최초거래({data.firstTransactionMonth}) 이후 데이터</p>
      )}
      <PriceHistoryChart entries={data.entries} />
      <PriceHistoryTable entries={data.entries} />
    </div>
  )
}
