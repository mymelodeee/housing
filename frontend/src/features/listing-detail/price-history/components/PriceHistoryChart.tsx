import { useMemo, useState } from 'react'
import type { PriceHistoryEntry } from '../types'
import './PriceHistoryChart.css'

interface PriceHistoryChartProps {
  entries: PriceHistoryEntry[]
}

const WIDTH = 600
const HEIGHT = 200
const PADDING_TOP = 16
const PADDING_BOTTOM = 24
const PADDING_LEFT = 64
const PADDING_RIGHT = 24
const TICK_COUNT = 4

export function PriceHistoryChart({ entries }: PriceHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate)),
    [entries]
  )

  const { points, ticks } = useMemo(() => {
    const prices = sorted.map((e) => e.transactionPrice)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const innerWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
    const innerHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM

    const toY = (price: number) => PADDING_TOP + innerHeight - ((price - min) / range) * innerHeight

    const pts = sorted.map((entry, i) => {
      const x =
        sorted.length === 1
          ? PADDING_LEFT + innerWidth / 2
          : PADDING_LEFT + (i / (sorted.length - 1)) * innerWidth
      return { x, y: toY(entry.transactionPrice), entry }
    })

    const tickValues = Array.from({ length: TICK_COUNT }, (_, i) => min + (range * i) / (TICK_COUNT - 1))
    const tickList = tickValues.map((price) => ({ price: Math.round(price), y: toY(price) }))

    return { points: pts, ticks: tickList }
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
