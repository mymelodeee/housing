import { useMemo, useState } from 'react'
import type { JeonseSaleEntry, JeonseEntry, JeonseRatioEntry } from '../types'
import { buildMonthlyAverageSeries, type MonthlySeriesPoint } from '../../../../shared/utils/monthlySeries'
import { formatEok, buildEokAxis } from '../../../../shared/utils/eokAxis'
import './JeonseHistoryChart.css'

interface JeonseHistoryChartProps {
  saleEntries: JeonseSaleEntry[]
  jeonseEntries: JeonseEntry[]
  ratioEntries: JeonseRatioEntry[]
  askingPrice?: number
}

const WIDTH = 600
const HEIGHT = 280
const PADDING_TOP = 16
const PADDING_BOTTOM = 36
const PADDING_LEFT = 64
const PADDING_RIGHT = 56
const TICK_COUNT = 4
const X_TICK_COUNT = 6

function formatManwon(value: number) {
  return `${Math.round(value).toLocaleString()}만원`
}

export function JeonseHistoryChart({ saleEntries, jeonseEntries, ratioEntries, askingPrice }: JeonseHistoryChartProps) {
  const [hovered, setHovered] = useState<{ x: number; y: number; label: string } | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  const hasAskingPrice = typeof askingPrice === 'number' && Number.isFinite(askingPrice) && askingPrice > 0

  const model = useMemo(() => {
    const saleMonthly = buildMonthlyAverageSeries(
      saleEntries.map((e) => ({ transactionDate: e.transactionDate, value: e.transactionPrice }))
    )
    const jeonseMonthly = buildMonthlyAverageSeries(
      jeonseEntries.map((e) => ({ transactionDate: e.transactionDate, value: e.deposit }))
    )
    const ratioByMonth = new Map(ratioEntries.map((r) => [r.month, r.jeonseRatioPercent]))

    const axisSet = new Set<string>()
    saleMonthly.forEach((p) => axisSet.add(p.month))
    jeonseMonthly.forEach((p) => axisSet.add(p.month))
    ratioEntries.forEach((r) => axisSet.add(r.month))
    const axis = [...axisSet].sort()
    const indexOf = new Map(axis.map((m, i) => [m, i]))

    const innerWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
    const innerHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
    const bottom = PADDING_TOP + innerHeight

    const toX = (month: string) =>
      axis.length <= 1 ? PADDING_LEFT + innerWidth / 2 : PADDING_LEFT + ((indexOf.get(month) ?? 0) / (axis.length - 1)) * innerWidth

    const priceValues = [...saleMonthly.map((p) => p.value), ...jeonseMonthly.map((p) => p.value)]
    if (hasAskingPrice) priceValues.push(askingPrice as number)
    const { min: minPrice, max: maxPrice, ticks: priceTickValues } = buildEokAxis(priceValues)
    const priceRange = maxPrice - minPrice || 1
    const toPriceY = (value: number) => PADDING_TOP + innerHeight - ((value - minPrice) / priceRange) * innerHeight

    const ratioValues = [...ratioByMonth.values()]
    const minRatio = ratioValues.length ? Math.min(...ratioValues) : 0
    const maxRatio = ratioValues.length ? Math.max(...ratioValues) : 100
    const ratioRange = maxRatio - minRatio || 1
    const toRatioY = (value: number) => PADDING_TOP + innerHeight - ((value - minRatio) / ratioRange) * innerHeight

    const salePoints = saleMonthly.map((p) => ({ x: toX(p.month), y: toPriceY(p.value), point: p }))
    const jeonsePoints = jeonseMonthly.map((p) => ({ x: toX(p.month), y: toPriceY(p.value), point: p }))
    const ratioPoints = [...ratioByMonth.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, value]) => ({ x: toX(month), y: toRatioY(value), month, value }))

    const avgRatio = ratioValues.length ? ratioValues.reduce((a, b) => a + b, 0) / ratioValues.length : null

    const xTickCount = Math.min(X_TICK_COUNT, axis.length)
    const xTickIndices =
      xTickCount <= 1 ? [0] : Array.from({ length: xTickCount }, (_, i) => Math.round((i / (xTickCount - 1)) * (axis.length - 1)))
    const xTicks = [...new Set(xTickIndices)].map((i) => ({ x: toX(axis[i]), label: axis[i] }))

    const priceTicks = priceTickValues.map((value) => ({ value, y: toPriceY(value) }))
    const ratioTicks = Array.from({ length: TICK_COUNT }, (_, i) => {
      const value = minRatio + (ratioRange * i) / (TICK_COUNT - 1)
      return { value: Math.round(value * 10) / 10, y: toRatioY(value) }
    })

    const saleByMonth = new Map(saleMonthly.map((p) => [p.month, p]))
    const jeonseByMonth = new Map(jeonseMonthly.map((p) => [p.month, p]))

    return {
      axis,
      salePoints,
      jeonsePoints,
      ratioPoints,
      priceTicks,
      ratioTicks,
      xTicks,
      chartBottom: bottom,
      askingY: hasAskingPrice ? toPriceY(askingPrice as number) : null,
      avgRatioY: avgRatio !== null ? toRatioY(avgRatio) : null,
      avgRatio,
      saleByMonth,
      jeonseByMonth,
      ratioByMonth,
    }
  }, [saleEntries, jeonseEntries, ratioEntries, hasAskingPrice, askingPrice])

  const toPolyline = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(' ')

  const series = [
    { name: '매매가', className: 'jeonse-history-chart__sale', points: model.salePoints },
    { name: '전세가', className: 'jeonse-history-chart__jeonse', points: model.jeonsePoints },
    { name: '전세가율(우측)', className: 'jeonse-history-chart__ratio', points: model.ratioPoints },
  ]

  const selectedSale: MonthlySeriesPoint | undefined = selectedMonth ? model.saleByMonth.get(selectedMonth) : undefined
  const selectedJeonse: MonthlySeriesPoint | undefined = selectedMonth ? model.jeonseByMonth.get(selectedMonth) : undefined
  const selectedRatio = selectedMonth ? model.ratioByMonth.get(selectedMonth) : undefined
  const hasSelection = selectedMonth !== null && (selectedSale || selectedJeonse || selectedRatio !== undefined)

  return (
    <div className="jeonse-history-chart">
      <div className="jeonse-history-chart__legend">
        {series.map((s) => (
          <span key={s.name} className="jeonse-history-chart__legend-item">
            <span className={`jeonse-history-chart__legend-swatch ${s.className}-swatch`} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="jeonse-history-chart__canvas">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="매매가·전세가·전세가율 변동 그래프">
          {model.priceTicks.map((tick, index) => (
            <g key={`price-tick-${index}`}>
              <line
                x1={PADDING_LEFT}
                y1={tick.y}
                x2={WIDTH - PADDING_RIGHT}
                y2={tick.y}
                className="jeonse-history-chart__gridline"
              />
              <text x={PADDING_LEFT - 6} y={tick.y + 4} textAnchor="end" className="jeonse-history-chart__axis-label">
                {formatEok(tick.value)}
              </text>
            </g>
          ))}
          {model.ratioPoints.length > 0 &&
            model.ratioTicks.map((tick, index) => (
              <text
                key={`ratio-tick-${index}`}
                x={WIDTH - PADDING_RIGHT + 6}
                y={tick.y + 4}
                textAnchor="start"
                className="jeonse-history-chart__axis-label jeonse-history-chart__axis-label--ratio"
              >
                {tick.value}%
              </text>
            ))}
          {model.xTicks.map((tick) => (
            <g key={tick.label}>
              <line
                x1={tick.x}
                y1={model.chartBottom}
                x2={tick.x}
                y2={model.chartBottom + 4}
                className="jeonse-history-chart__gridline"
              />
              <text x={tick.x} y={model.chartBottom + 16} textAnchor="middle" className="jeonse-history-chart__axis-label">
                {tick.label}
              </text>
            </g>
          ))}
          {model.avgRatioY !== null && (
            <line
              x1={PADDING_LEFT}
              y1={model.avgRatioY}
              x2={WIDTH - PADDING_RIGHT}
              y2={model.avgRatioY}
              className="jeonse-history-chart__avg-ratio-line"
            />
          )}
          {model.askingY !== null && (
            <g>
              <line
                x1={PADDING_LEFT}
                y1={model.askingY}
                x2={WIDTH - PADDING_RIGHT}
                y2={model.askingY}
                className="jeonse-history-chart__asking-line"
              />
              <text x={WIDTH - PADDING_RIGHT + 6} y={model.askingY - 6} className="jeonse-history-chart__asking-label">
                현재 호가
              </text>
            </g>
          )}
          {series.map(
            (s) =>
              s.points.length > 1 && (
                <polyline key={s.name} points={toPolyline(s.points)} className={`${s.className}-line`} fill="none" />
              )
          )}
          {series.map((s) =>
            s.points.map((p, i) => {
              const isCarried = 'point' in p && (p as { point: MonthlySeriesPoint }).point.isCarried
              const month = 'point' in p ? (p as { point: MonthlySeriesPoint }).point.month : (p as { month: string }).month
              const label =
                'point' in p
                  ? `${month} · ${s.name} ${formatManwon((p as { point: MonthlySeriesPoint }).point.value)}${
                      isCarried ? ' (직전 거래 유지)' : ''
                    }`
                  : `${month} · ${s.name} ${(p as { value: number }).value}%`
              return (
                <circle
                  key={`${s.name}-${month}-${i}`}
                  data-testid={`${s.className}-point`}
                  cx={p.x}
                  cy={p.y}
                  r={isCarried ? 3 : 4}
                  className={
                    isCarried ? `${s.className}-point ${s.className}-point--carried` : `${s.className}-point`
                  }
                  tabIndex={0}
                  onMouseEnter={() => setHovered({ x: p.x, y: p.y, label })}
                  onFocus={() => setHovered({ x: p.x, y: p.y, label })}
                  onMouseLeave={() => setHovered(null)}
                  onBlur={() => setHovered(null)}
                  onClick={() => setSelectedMonth((prev) => (prev === month ? null : month))}
                />
              )
            })
          )}
        </svg>
        {hovered && (
          <div
            className="jeonse-history-chart__hover-tooltip"
            style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
          >
            {hovered.label}
          </div>
        )}
      </div>
      {model.avgRatio !== null && (
        <p className="jeonse-history-chart__avg-ratio-note">평균 전세가율 {Math.round(model.avgRatio * 10) / 10}%</p>
      )}
      {hasSelection && (
        <div className="jeonse-history-chart__detail">
          <strong>{selectedMonth}</strong>
          {selectedSale && (
            <p>
              매매 평균 {formatManwon(selectedSale.value)}
              {selectedSale.isCarried ? ' (직전 거래 유지)' : ` · 거래 ${selectedSale.count}건`}
            </p>
          )}
          {selectedJeonse && (
            <p>
              전세 평균 {formatManwon(selectedJeonse.value)}
              {selectedJeonse.isCarried ? ' (직전 거래 유지)' : ` · 거래 ${selectedJeonse.count}건`}
            </p>
          )}
          {selectedRatio !== undefined && <p>전세가율 {selectedRatio}%</p>}
        </div>
      )}
    </div>
  )
}
