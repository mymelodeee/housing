import { useMemo, useState } from 'react'
import { useComplexJeonseHistory } from '../hooks/useComplexJeonseHistory'
import { buildMonthlyAverageSeries } from '../../../shared/utils/monthlySeries'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import { ExclusiveAreaFilter } from './ExclusiveAreaFilter'
import { JeonseHistoryChart } from '../../listing-detail/jeonse-history/components/JeonseHistoryChart'
import '../../listing-detail/jeonse-history/components/JeonseHistoryTab.css'

interface ComplexJeonseHistoryTabProps {
  complexId: string
}

export function ComplexJeonseHistoryTab({ complexId }: ComplexJeonseHistoryTabProps) {
  const [selectedArea, setSelectedArea] = useState<number | null>(null)
  const { data, isLoading, isError } = useComplexJeonseHistory(complexId, selectedArea)

  const saleMonthly = useMemo(
    () =>
      buildMonthlyAverageSeries(
        (data?.saleEntries ?? []).map((e) => ({ transactionDate: e.transactionDate, value: e.transactionPrice }))
      ),
    [data?.saleEntries]
  )
  const latestRatio = data?.ratioEntries[data.ratioEntries.length - 1]
  const latestSale = saleMonthly[saleMonthly.length - 1]

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">전세가 변동 이력을 불러오지 못했습니다.</p>
  if (data.availableExclusiveAreas.length === 0 && data.jeonseEntries.length === 0 && data.saleEntries.length === 0) {
    return <p>실거래 이력 없음</p>
  }

  const sortedJeonse = [...data.jeonseEntries].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))

  return (
    <div className="jeonse-history-tab">
      {data.availableExclusiveAreas.length > 0 && (
        <ExclusiveAreaFilter areas={data.availableExclusiveAreas} value={selectedArea} onChange={setSelectedArea} />
      )}
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
      <JeonseHistoryChart saleEntries={data.saleEntries} jeonseEntries={data.jeonseEntries} ratioEntries={data.ratioEntries} />
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
