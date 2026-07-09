import { useMemo, useState } from 'react'
import type { PriceHistoryEntry } from '../types'
import './PriceHistoryChart.css'

interface PriceHistoryChartProps {
  entries: PriceHistoryEntry[]
}

const WIDTH = 600
const HEIGHT = 200
const PADDING = 24

export function PriceHistoryChart({ entries }: PriceHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate)),
    [entries]
  )

  const { points, minPrice, maxPrice } = useMemo(() => {
    const prices = sorted.map((e) => e.transactionPrice)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const innerWidth = WIDTH - PADDING * 2
    const innerHeight = HEIGHT - PADDING * 2

    const pts = sorted.map((entry, i) => {
      const x = sorted.length === 1 ? WIDTH / 2 : PADDING + (i / (sorted.length - 1)) * innerWidth
      const y = PADDING + innerHeight - ((entry.transactionPrice - min) / range) * innerHeight
      return { x, y, entry }
    })

    return { points: pts, minPrice: min, maxPrice: max }
  }, [sorted])

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const lastPoint = points[points.length - 1]

  return (
    <div className="price-history-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="매매가 변동 그래프">
        <line x1={PADDING} y1={PADDING} x2={WIDTH - PADDING} y2={PADDING} className="price-history-chart__gridline" />
        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} className="price-history-chart__gridline" />
        <text x={PADDING} y={PADDING - 6} className="price-history-chart__axis-label">{maxPrice.toLocaleString()}만원</text>
        <text x={PADDING} y={HEIGHT - PADDING + 14} className="price-history-chart__axis-label">{minPrice.toLocaleString()}만원</text>
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
