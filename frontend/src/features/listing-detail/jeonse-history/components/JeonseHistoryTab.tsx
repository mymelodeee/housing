import { useMemo } from 'react'
import { useListingJeonseHistory } from '../hooks/useListingJeonseHistory'
import { useListing } from '../../hooks/useListing'
import { buildMonthlyAverageSeries } from '../../../../shared/utils/monthlySeries'
import { formatPriceKorean } from '../../../../shared/utils/formatPrice'
import { JeonseHistoryChart } from './JeonseHistoryChart'
import './JeonseHistoryTab.css'

interface JeonseHistoryTabProps {
  listingId: string
}

export function JeonseHistoryTab({ listingId }: JeonseHistoryTabProps) {
  const { data, isLoading, isError } = useListingJeonseHistory(listingId)
  const { data: listing } = useListing(listingId)

  const saleMonthly = useMemo(
    () =>
      buildMonthlyAverageSeries(
        (data?.saleEntries ?? []).map((e) => ({ transactionDate: e.transactionDate, value: e.transactionPrice }))
      ),
    [data?.saleEntries]
  )
  const latestRatio = data?.ratioEntries[data.ratioEntries.length - 1]
  const latestSale = saleMonthly[saleMonthly.length - 1]
  const askingPrice = listing?.salePrice

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">전세가 변동 이력을 불러오지 못했습니다.</p>
  if (data.jeonseEntries.length === 0 && data.saleEntries.length === 0) return <p>실거래 이력 없음</p>

  const sortedJeonse = [...data.jeonseEntries].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))

  return (
    <div className="jeonse-history-tab">
      {(latestSale || latestRatio) && (
        <div className="jeonse-history-tab__summary">
          {latestSale && (
            <div>
              <div className="jeonse-history-tab__summary-label">매매 월평균({latestSale.month})</div>
              <div className="jeonse-history-tab__summary-value">{formatPriceKorean(Math.round(latestSale.value))}</div>
            </div>
          )}
          {latestRatio && (
            <div className="jeonse-history-tab__ratio-badge">전세가율 {latestRatio.jeonseRatioPercent}%</div>
          )}
        </div>
      )}
      <p className="jeonse-history-tab__notice">{data.lookupWindowNote}</p>
      {data.jeonseEntries.length === 0 && (
        <p className="jeonse-history-tab__notice">전세 실거래 이력 없음 (전월세 데이터 미연동 시 표시되지 않습니다)</p>
      )}
      <JeonseHistoryChart
        saleEntries={data.saleEntries}
        jeonseEntries={data.jeonseEntries}
        ratioEntries={data.ratioEntries}
        askingPrice={askingPrice}
      />
      {sortedJeonse.length > 0 && (
        <table className="jeonse-history-tab__table">
          <thead>
            <tr>
              <th>거래일자</th>
              <th>전세가</th>
              <th>데이터 출처</th>
            </tr>
          </thead>
          <tbody>
            {sortedJeonse.map((entry, i) => (
              <tr key={`${entry.transactionDate}-${i}`}>
                <td>{entry.transactionDate}</td>
                <td>{entry.deposit.toLocaleString()}만원</td>
                <td>{entry.dataSource}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
