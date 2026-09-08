import { useMemo, useState } from 'react'
import type { PriceHistoryEntry } from '../types'
import { buildMonthlyAverageSeries } from '../../../../shared/utils/monthlySeries'
import { formatEok, buildEokAxis } from '../../../../shared/utils/eokAxis'
import './PriceHistoryChart.css'

interface PriceHistoryChartProps {
  entries: PriceHistoryEntry[]
  askingPrice?: number
}

const WIDTH = 600
const HEIGHT = 260
const PADDING_TOP = 26
const PADDING_BOTTOM = 36
const PADDING_LEFT = 64
const PADDING_RIGHT = 64
const X_TICK_COUNT = 6

function formatManwon(value: number) {
  return `${Math.round(value).toLocaleString()}만원`
}

export function PriceHistoryChart({ entries, askingPrice }: PriceHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const monthly = useMemo(
    () => buildMonthlyAverageSeries(entries.map((e) => ({ transactionDate: e.transactionDate, value: e.transactionPrice }))),
    [entries]
  )

  const hasAskingPrice = typeof askingPrice === 'number' && Number.isFinite(askingPrice) && askingPrice > 0

  const { points, ticks, xTicks, chartBottom, askingY } = useMemo(() => {
    const values = monthly.map((p) => p.value)
    const domainValues = hasAskingPrice ? [...values, askingPrice as number] : values
    const { min, max, ticks: tickValues } = buildEokAxis(domainValues)
    const range = max - min || 1
    const innerWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
    const innerHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
    const bottom = PADDING_TOP + innerHeight

    const toY = (value: number) => PADDING_TOP + innerHeight - ((value - min) / range) * innerHeight
    const toX = (i: number) =>
      monthly.length === 1 ? PADDING_LEFT + innerWidth / 2 : PADDING_LEFT + (i / (monthly.length - 1)) * innerWidth

    const pts = monthly.map((point, i) => ({ x: toX(i), y: toY(point.value), point }))

    const tickList = tickValues.map((value) => ({ value, y: toY(value) }))

    const xTickCount = Math.min(X_TICK_COUNT, monthly.length)
    const xTickIndices =
      xTickCount <= 1
        ? [0]
        : Array.from({ length: xTickCount }, (_, i) => Math.round((i / (xTickCount - 1)) * (monthly.length - 1)))
    const xTickList = [...new Set(xTickIndices)].map((i) => ({ x: toX(i), label: monthly[i].month }))

    return {
      points: pts,
      ticks: tickList,
      xTicks: xTickList,
      chartBottom: bottom,
      askingY: hasAskingPrice ? toY(askingPrice as number) : null,
    }
  }, [monthly, hasAskingPrice, askingPrice])

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const lastPoint = points[points.length - 1]
  const selectedPoint = selectedIndex !== null ? points[selectedIndex] : null
  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null

  return (
    <div className="price-history-chart">
      <div className="price-history-chart__canvas">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="매매가 변동 그래프">
          {ticks.map((tick, index) => (
            <g key={`price-tick-${index}`}>
              <line
                x1={PADDING_LEFT}
                y1={tick.y}
                x2={WIDTH - PADDING_RIGHT}
                y2={tick.y}
                className="price-history-chart__gridline"
              />
              <text x={PADDING_LEFT - 6} y={tick.y + 4} textAnchor="end" className="price-history-chart__axis-label">
                {formatEok(tick.value)}
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
          {askingY !== null && (
            <g>
              <line
                x1={PADDING_LEFT}
                y1={askingY}
                x2={WIDTH - PADDING_RIGHT}
                y2={askingY}
                className="price-history-chart__asking-line"
              />
              <text x={WIDTH - PADDING_RIGHT + 6} y={askingY + 4} className="price-history-chart__asking-label">
                현재 호가
              </text>
            </g>
          )}
          {points.length > 1 && (
            <polyline points={polylinePoints} className="price-history-chart__line" fill="none" />
          )}
          {points.map((p, i) => (
            <circle
              key={`${p.point.month}-${i}`}
              data-testid="price-point"
              data-carried={p.point.isCarried}
              cx={p.x}
              cy={p.y}
              r={p.point.isCarried ? 3 : 4.5}
              className={
                p.point.isCarried ? 'price-history-chart__point price-history-chart__point--carried' : 'price-history-chart__point'
              }
              tabIndex={0}
              onMouseEnter={() => setHoveredIndex(i)}
              onFocus={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => setSelectedIndex((prev) => (prev === i ? null : i))}
            />
          ))}
          {lastPoint && (
            <text
              x={lastPoint.x}
              y={Math.max(lastPoint.y - 10, 10)}
              className="price-history-chart__end-label"
              textAnchor="end"
            >
              {formatManwon(lastPoint.point.value)}
            </text>
          )}
        </svg>
        {hoveredPoint && (
          <div
            className="price-history-chart__hover-tooltip"
            style={{ left: `${(hoveredPoint.x / WIDTH) * 100}%`, top: `${(hoveredPoint.y / HEIGHT) * 100}%` }}
          >
            {hoveredPoint.point.month} · {formatManwon(hoveredPoint.point.value)}
            {hoveredPoint.point.isCarried ? ' (직전 거래 유지)' : ` (${hoveredPoint.point.count}건)`}
          </div>
        )}
      </div>
      {selectedPoint && (
        <div className="price-history-chart__detail">
          <div className="price-history-chart__detail-header">
            <strong>{selectedPoint.point.month}</strong>
            <span>월평균 {formatManwon(selectedPoint.point.value)}</span>
          </div>
          {selectedPoint.point.isCarried ? (
            <p className="price-history-chart__detail-empty">
              이번 달 거래 없음 · 직전 거래가 기준으로 이어서 표시됩니다.
            </p>
          ) : (
            <ul className="price-history-chart__detail-list">
              {selectedPoint.point.transactions.map((t) => (
                <li key={t.date}>
                  <span>{t.date}</span>
                  <span>{formatManwon(t.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
