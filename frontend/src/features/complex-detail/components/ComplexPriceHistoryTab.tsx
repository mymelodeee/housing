import { useMemo, useState } from 'react'
import { useComplexPriceHistory } from '../hooks/useComplexPriceHistory'
import { buildMonthlyAverageSeries, findYearAgoPoint } from '../../../shared/utils/monthlySeries'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import { getAvailableExclusiveAreas, filterByExclusiveArea } from '../utils/exclusiveArea'
import { filterByPeriod, type Period } from '../utils/periodFilter'
import { ExclusiveAreaFilter } from './ExclusiveAreaFilter'
import { PeriodFilter } from './PeriodFilter'
import { PriceHistoryChart } from '../../listing-detail/price-history/components/PriceHistoryChart'
import { PriceHistoryTable } from '../../listing-detail/price-history/components/PriceHistoryTable'
import '../../listing-detail/price-history/components/PriceHistoryTab.css'

interface ComplexPriceHistoryTabProps {
  complexId: string
}

export function ComplexPriceHistoryTab({ complexId }: ComplexPriceHistoryTabProps) {
  const { data, isLoading, isError } = useComplexPriceHistory(complexId)
  const [selectedArea, setSelectedArea] = useState<number | null>(null)
  const [period, setPeriod] = useState<Period>('all')

  const availableAreas = useMemo(() => getAvailableExclusiveAreas(data?.entries ?? []), [data?.entries])
  const filteredEntries = useMemo(
    () => filterByExclusiveArea(data?.entries ?? [], selectedArea),
    [data?.entries, selectedArea]
  )
  // 기간 filter는 차트/표에 보이는 과거 구간만 좁힌다 — 최근 월평균/최고가/전년동월대비는
  // 항상 전체 기간 기준으로 유지해야 기간을 좁혀도 요약 숫자가 왜곡되지 않는다.
  const periodEntries = useMemo(
    () => filterByPeriod(filteredEntries, period, (e) => e.transactionDate.slice(0, 7)),
    [filteredEntries, period]
  )

  const monthly = useMemo(
    () =>
      buildMonthlyAverageSeries(
        filteredEntries.map((e) => ({ transactionDate: e.transactionDate, value: e.transactionPrice }))
      ),
    [filteredEntries]
  )
  const latest = monthly[monthly.length - 1]
  const yearAgo = latest ? findYearAgoPoint(monthly, latest.month) : undefined
  const volumeChangePercent =
    latest && yearAgo && yearAgo.count > 0 ? Math.round(((latest.count - yearAgo.count) / yearAgo.count) * 1000) / 10 : null

  const maxPrice = filteredEntries.length > 0 ? Math.max(...filteredEntries.map((e) => e.transactionPrice)) : null
  const priceVsMaxPercent =
    latest && maxPrice ? Math.round((latest.value / maxPrice) * 1000) / 10 : null

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">매매가 변동 이력을 불러오지 못했습니다.</p>
  if (data.entries.length === 0) return <p>실거래 이력 없음</p>

  return (
    <div className="price-history-tab">
      {availableAreas.length > 0 && (
        <ExclusiveAreaFilter areas={availableAreas} value={selectedArea} onChange={setSelectedArea} />
      )}
      <PeriodFilter value={period} onChange={setPeriod} />
      {latest && (
        <div className="price-history-tab__summary">
          <div>
            <div className="price-history-tab__summary-label">최근 실거래 월평균({latest.month})</div>
            <div className="price-history-tab__summary-value">{formatPriceKorean(Math.round(latest.value))}</div>
          </div>
          {maxPrice !== null && (
            <div>
              <div className="price-history-tab__summary-label">최고가 대비</div>
              <div className="price-history-tab__summary-value">
                {formatPriceKorean(maxPrice)} ({priceVsMaxPercent}%)
              </div>
            </div>
          )}
          <div>
            <div className="price-history-tab__summary-label">{latest.month} 거래량</div>
            <div className="price-history-tab__summary-value">
              {latest.count}건
              {volumeChangePercent !== null && (
                <span
                  className={
                    volumeChangePercent >= 0
                      ? 'price-history-tab__diff-pill price-history-tab__diff-pill--up'
                      : 'price-history-tab__diff-pill price-history-tab__diff-pill--down'
                  }
                >
                  전년동월대비 {volumeChangePercent >= 0 ? '▲' : '▼'} {Math.abs(volumeChangePercent)}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {data.lookupPeriodType === '최초거래 이후' && data.firstTransactionMonth && (
        <p className="price-history-tab__notice">최초거래({data.firstTransactionMonth}) 이후 데이터</p>
      )}
      <PriceHistoryChart entries={periodEntries} />
      <PriceHistoryTable entries={periodEntries} />
    </div>
  )
}
