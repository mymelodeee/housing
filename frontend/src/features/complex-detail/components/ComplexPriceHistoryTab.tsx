import { useMemo } from 'react'
import { useComplexPriceHistory } from '../hooks/useComplexPriceHistory'
import { buildMonthlyAverageSeries } from '../../../shared/utils/monthlySeries'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import { PriceHistoryChart } from '../../listing-detail/price-history/components/PriceHistoryChart'
import { PriceHistoryTable } from '../../listing-detail/price-history/components/PriceHistoryTable'
import '../../listing-detail/price-history/components/PriceHistoryTab.css'

interface ComplexPriceHistoryTabProps {
  complexId: string
}

export function ComplexPriceHistoryTab({ complexId }: ComplexPriceHistoryTabProps) {
  const { data, isLoading, isError } = useComplexPriceHistory(complexId)

  const monthly = useMemo(
    () =>
      buildMonthlyAverageSeries(
        (data?.entries ?? []).map((e) => ({ transactionDate: e.transactionDate, value: e.transactionPrice }))
      ),
    [data?.entries]
  )
  const latest = monthly[monthly.length - 1]

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
        </div>
      )}
      {data.lookupPeriodType === '최초거래 이후' && data.firstTransactionMonth && (
        <p className="price-history-tab__notice">최초거래({data.firstTransactionMonth}) 이후 데이터</p>
      )}
      <PriceHistoryChart entries={data.entries} />
      <PriceHistoryTable entries={data.entries} />
    </div>
  )
}
