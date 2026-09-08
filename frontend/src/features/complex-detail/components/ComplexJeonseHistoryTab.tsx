import { useMemo, useState } from 'react'
import { useComplexJeonseHistory } from '../hooks/useComplexJeonseHistory'
import { buildMonthlyAverageSeries } from '../../../shared/utils/monthlySeries'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import { ExclusiveAreaFilter } from './ExclusiveAreaFilter'
import { PeriodFilter } from './PeriodFilter'
import { filterByPeriod, type Period } from '../utils/periodFilter'
import { JeonseHistoryChart } from '../../listing-detail/jeonse-history/components/JeonseHistoryChart'
import '../../listing-detail/jeonse-history/components/JeonseHistoryTab.css'

interface ComplexJeonseHistoryTabProps {
  complexId: string
}

export function ComplexJeonseHistoryTab({ complexId }: ComplexJeonseHistoryTabProps) {
  const [selectedArea, setSelectedArea] = useState<number | null>(null)
  const [period, setPeriod] = useState<Period>('all')
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

  // 기간 filter는 차트/표(과거 구간)만 좁히고, 최신 요약(매매 월평균/전세가율 배지)은
  // 항상 전체 기간 기준을 유지한다(매매가 탭과 동일한 원칙).
  const periodSaleEntries = useMemo(
    () => filterByPeriod(data?.saleEntries ?? [], period, (e) => e.transactionDate.slice(0, 7)),
    [data?.saleEntries, period]
  )
  const periodJeonseEntries = useMemo(
    () => filterByPeriod(data?.jeonseEntries ?? [], period, (e) => e.transactionDate.slice(0, 7)),
    [data?.jeonseEntries, period]
  )
  const periodRatioEntries = useMemo(
    () => filterByPeriod(data?.ratioEntries ?? [], period, (e) => e.month),
    [data?.ratioEntries, period]
  )

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">전세가 변동 이력을 불러오지 못했습니다.</p>
  if (data.availableExclusiveAreas.length === 0 && data.jeonseEntries.length === 0 && data.saleEntries.length === 0) {
    return <p>실거래 이력 없음</p>
  }

  const sortedJeonse = [...periodJeonseEntries].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))

  return (
    <div className="jeonse-history-tab">
      {data.availableExclusiveAreas.length > 0 && (
        <ExclusiveAreaFilter areas={data.availableExclusiveAreas} value={selectedArea} onChange={setSelectedArea} />
      )}
      <PeriodFilter value={period} onChange={setPeriod} />
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
        saleEntries={periodSaleEntries}
        jeonseEntries={periodJeonseEntries}
        ratioEntries={periodRatioEntries}
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
