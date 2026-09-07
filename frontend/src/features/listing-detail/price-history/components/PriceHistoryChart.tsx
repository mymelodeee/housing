import { useMemo, useState } from 'react'
import type { PriceHistoryEntry } from '../types'
import './PriceHistoryChart.css'

interface PriceHistoryChartProps {
  entries: PriceHistoryEntry[]
}

const WIDTH = 600
const HEIGHT = 220
const PADDING_TOP = 16
const PADDING_BOTTOM = 36
const PADDING_LEFT = 64
const PADDING_RIGHT = 24
const TICK_COUNT = 4
const X_TICK_COUNT = 6

function formatYearMonth(dateString: string) {
  return dateString.slice(0, 7)
}

export function PriceHistoryChart({ entries }: PriceHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate)),
    [entries]
  )

  const { points, ticks, xTicks, chartBottom } = useMemo(() => {
    const prices = sorted.map((e) => e.transactionPrice)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const innerWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
    const innerHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
    const bottom = PADDING_TOP + innerHeight

    const toY = (price: number) => PADDING_TOP + innerHeight - ((price - min) / range) * innerHeight
    const toX = (i: number) => (sorted.length === 1 ? PADDING_LEFT + innerWidth / 2 : PADDING_LEFT + (i / (sorted.length - 1)) * innerWidth)

    const pts = sorted.map((entry, i) => ({ x: toX(i), y: toY(entry.transactionPrice), entry }))

    const tickValues = Array.from({ length: TICK_COUNT }, (_, i) => min + (range * i) / (TICK_COUNT - 1))
    const tickList = tickValues.map((price) => ({ price: Math.round(price), y: toY(price) }))

    const xTickCount = Math.min(X_TICK_COUNT, sorted.length)
    const xTickIndices =
      xTickCount <= 1
        ? [0]
        : Array.from({ length: xTickCount }, (_, i) => Math.round((i / (xTickCount - 1)) * (sorted.length - 1)))
    const seenMonths = new Set<string>()
    const xTickList = xTickIndices
      .map((i) => ({ x: toX(i), label: formatYearMonth(sorted[i].transactionDate) }))
      .filter((tick) => {
        if (seenMonths.has(tick.label)) return false
        seenMonths.add(tick.label)
        return true
      })

    return { points: pts, ticks: tickList, xTicks: xTickList, chartBottom: bottom }
  }, [sorted])

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const lastPoint = points[points.length - 1]

  return (
    <div className="price-history-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="매매가 변동 그래프">
        {ticks.map((tick) => (
          <g key={tick.price}>
            <line
              x1={PADDING_LEFT}
              y1={tick.y}
              x2={WIDTH - PADDING_RIGHT}
              y2={tick.y}
              className="price-history-chart__gridline"
            />
            <text
              x={PADDING_LEFT - 6}
              y={tick.y + 4}
              textAnchor="end"
              className="price-history-chart__axis-label"
            >
              {tick.price.toLocaleString()}만원
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <g key={tick.label}>
            <line
              x1={tick.x}
              y1={chartBottom}
              x2={tick.x}
              y2={chartBottom + 4}
              className="price-history-chart__gridline"
            />
            <text x={tick.x} y={chartBottom + 16} textAnchor="middle" className="price-history-chart__axis-label">
              {tick.label}
            </text>
          </g>
        ))}
        {points.length > 1 && (
          <polyline points={polylinePoints} className="price-history-chart__line" fill="none" />
        )}
        {points.map((p, i) => (
          <circle
            key={p.entry.transactionDate + i}
            data-testid="price-point"
            cx={p.x}
            cy={p.y}
            r={4}
            className="price-history-chart__point"
            tabIndex={0}
            onMouseEnter={() => setHoveredIndex(i)}
            onFocus={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onBlur={() => setHoveredIndex(null)}
          />
        ))}
        {lastPoint && (
          <text x={lastPoint.x} y={lastPoint.y - 10} className="price-history-chart__end-label" textAnchor="end">
            {lastPoint.entry.transactionPrice.toLocaleString()}만원
          </text>
        )}
      </svg>
      {hoveredIndex !== null && (
        <div className="price-history-chart__tooltip">
          {points[hoveredIndex].entry.transactionDate} · {points[hoveredIndex].entry.transactionPrice.toLocaleString()}만원
        </div>
      )}
    </div>
  )
}
