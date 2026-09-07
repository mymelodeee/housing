import { useMemo } from 'react'
import { useListingPriceHistory } from '../hooks/useListingPriceHistory'
import { useListing } from '../../hooks/useListing'
import { buildMonthlyAverageSeries } from '../../../../shared/utils/monthlySeries'
import { formatPriceKorean } from '../../../../shared/utils/formatPrice'
import { PriceHistoryChart } from './PriceHistoryChart'
import { PriceHistoryTable } from './PriceHistoryTable'
import './PriceHistoryTab.css'

interface PriceHistoryTabProps {
  listingId: string
}

export function PriceHistoryTab({ listingId }: PriceHistoryTabProps) {
  const { data, isLoading, isError } = useListingPriceHistory(listingId)
  const { data: listing } = useListing(listingId)

  const monthly = useMemo(
    () =>
      buildMonthlyAverageSeries(
        (data?.entries ?? []).map((e) => ({ transactionDate: e.transactionDate, value: e.transactionPrice }))
      ),
    [data?.entries]
  )
  const latest = monthly[monthly.length - 1]
  const askingPrice = listing?.salePrice
  const diffPercent =
    latest && typeof askingPrice === 'number' && askingPrice > 0
      ? Math.round(((latest.value - askingPrice) / askingPrice) * 1000) / 10
      : null

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">매매가 변동 이력을 불러오지 못했습니다.</p>
  if (data.entries.length === 0) return <p>실거래 이력 없음</p>

  return (
    <div className="price-history-tab">
      {latest && (
        <div className="price-history-tab__summary">
          <div>
            <div className="price-history-tab__summary-label">최근 실거래 월평균({latest.month})</div>
            <div className="price-history-tab__summary-value">{formatPriceKorean(Math.round(latest.value))}</div>
          </div>
          {diffPercent !== null && (
            <span
              className={
                diffPercent >= 0
                  ? 'price-history-tab__diff-pill price-history-tab__diff-pill--up'
                  : 'price-history-tab__diff-pill price-history-tab__diff-pill--down'
              }
            >
              호가 대비 {diffPercent >= 0 ? '▲' : '▼'} {Math.abs(diffPercent)}%
            </span>
          )}
        </div>
      )}
      {data.lookupPeriodType === '최초거래 이후' && data.firstTransactionMonth && (
        <p className="price-history-tab__notice">최초거래({data.firstTransactionMonth}) 이후 데이터</p>
      )}
      <PriceHistoryChart entries={data.entries} askingPrice={askingPrice} />
      <PriceHistoryTable entries={data.entries} />
    </div>
  )
}
