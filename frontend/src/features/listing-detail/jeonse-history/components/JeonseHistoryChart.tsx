import { useMemo, useState } from 'react'
import type { JeonseSaleEntry, JeonseEntry, JeonseRatioEntry } from '../types'
import './JeonseHistoryChart.css'

interface JeonseHistoryChartProps {
  saleEntries: JeonseSaleEntry[]
  jeonseEntries: JeonseEntry[]
  ratioEntries: JeonseRatioEntry[]
}

const WIDTH = 600
const HEIGHT = 240
const PADDING_TOP = 16
const PADDING_BOTTOM = 24
const PADDING_LEFT = 64
const PADDING_RIGHT = 48
const TICK_COUNT = 4

interface HoverInfo {
  label: string
  x: number
  y: number
}

function toTime(dateString: string) {
  return new Date(dateString).getTime()
}

export function JeonseHistoryChart({ saleEntries, jeonseEntries, ratioEntries }: JeonseHistoryChartProps) {
  const [hovered, setHovered] = useState<HoverInfo | null>(null)

  const { salePoints, jeonsePoints, ratioPoints, priceTicks, ratioTicks } = useMemo(() => {
    const sortedSale = [...saleEntries].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate))
    const sortedJeonse = [...jeonseEntries].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate))
    const sortedRatio = [...ratioEntries].sort((a, b) => a.month.localeCompare(b.month))

    const times = [
      ...sortedSale.map((e) => toTime(e.transactionDate)),
      ...sortedJeonse.map((e) => toTime(e.transactionDate)),
      ...sortedRatio.map((e) => toTime(`${e.month}-15`)),
    ]
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const timeRange = maxTime - minTime || 1

    const prices = [...sortedSale.map((e) => e.transactionPrice), ...sortedJeonse.map((e) => e.deposit)]
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    const ratios = sortedRatio.map((e) => e.jeonseRatioPercent)
    const minRatio = ratios.length > 0 ? Math.min(...ratios) : 0
    const maxRatio = ratios.length > 0 ? Math.max(...ratios) : 100
    const ratioRange = maxRatio - minRatio || 1

    const innerWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
    const innerHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM

    const toX = (time: number) => PADDING_LEFT + ((time - minTime) / timeRange) * innerWidth
    const toPriceY = (price: number) => PADDING_TOP + innerHeight - ((price - minPrice) / priceRange) * innerHeight
    const toRatioY = (ratio: number) => PADDING_TOP + innerHeight - ((ratio - minRatio) / ratioRange) * innerHeight

    return {
      salePoints: sortedSale.map((entry) => ({
        x: toX(toTime(entry.transactionDate)),
        y: toPriceY(entry.transactionPrice),
        label: `${entry.transactionDate} · 매매가 ${entry.transactionPrice.toLocaleString()}만원`,
      })),
      jeonsePoints: sortedJeonse.map((entry) => ({
        x: toX(toTime(entry.transactionDate)),
        y: toPriceY(entry.deposit),
        label: `${entry.transactionDate} · 전세가 ${entry.deposit.toLocaleString()}만원`,
      })),
      ratioPoints: sortedRatio.map((entry) => ({
        x: toX(toTime(`${entry.month}-15`)),
        y: toRatioY(entry.jeonseRatioPercent),
        label: `${entry.month} · 전세가율 ${entry.jeonseRatioPercent}%`,
      })),
      priceTicks: Array.from({ length: TICK_COUNT }, (_, i) => {
        const price = minPrice + (priceRange * i) / (TICK_COUNT - 1)
        return { value: Math.round(price), y: toPriceY(price) }
      }),
      ratioTicks: Array.from({ length: TICK_COUNT }, (_, i) => {
        const ratio = minRatio + (ratioRange * i) / (TICK_COUNT - 1)
        return { value: Math.round(ratio * 10) / 10, y: toRatioY(ratio) }
      }),
    }
  }, [saleEntries, jeonseEntries, ratioEntries])

  const toPolyline = (points: { x: number; y: number }[]) => points.map((p) => `${p.x},${p.y}`).join(' ')

  const series = [
    { name: '매매가', className: 'jeonse-history-chart__sale', points: salePoints },
    { name: '전세가', className: 'jeonse-history-chart__jeonse', points: jeonsePoints },
    { name: '전세가율(우측)', className: 'jeonse-history-chart__ratio', points: ratioPoints },
  ]

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
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="매매가·전세가·전세가율 변동 그래프">
        {priceTicks.map((tick) => (
          <g key={`price-${tick.value}`}>
            <line
              x1={PADDING_LEFT}
              y1={tick.y}
              x2={WIDTH - PADDING_RIGHT}
              y2={tick.y}
              className="jeonse-history-chart__gridline"
            />
            <text x={PADDING_LEFT - 6} y={tick.y + 4} textAnchor="end" className="jeonse-history-chart__axis-label">
              {tick.value.toLocaleString()}만원
            </text>
          </g>
        ))}
        {ratioPoints.length > 0 &&
          ratioTicks.map((tick) => (
            <text
              key={`ratio-${tick.value}`}
              x={WIDTH - PADDING_RIGHT + 6}
              y={tick.y + 4}
              textAnchor="start"
              className="jeonse-history-chart__axis-label jeonse-history-chart__axis-label--ratio"
            >
              {tick.value}%
            </text>
          ))}
        {series.map(
          (s) =>
            s.points.length > 1 && (
              <polyline key={s.name} points={toPolyline(s.points)} className={`${s.className}-line`} fill="none" />
            )
        )}
        {series.map((s) =>
          s.points.map((p, i) => (
            <circle
              key={`${s.name}-${i}`}
              data-testid={`${s.className}-point`}
              cx={p.x}
              cy={p.y}
              r={4}
              className={`${s.className}-point`}
              tabIndex={0}
              onMouseEnter={() => setHovered(p)}
              onFocus={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              onBlur={() => setHovered(null)}
            />
          ))
        )}
      </svg>
      {hovered !== null && <div className="jeonse-history-chart__tooltip">{hovered.label}</div>}
    </div>
  )
}
