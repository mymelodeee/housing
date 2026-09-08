import type { Period } from '../utils/periodFilter'
import './PeriodFilter.css'

interface PeriodFilterProps {
  value: Period
  onChange: (period: Period) => void
}

const OPTIONS: { value: Period; label: string }[] = [
  { value: '1y', label: '최근 1년' },
  { value: '3y', label: '최근 3년' },
  { value: 'all', label: '전체' },
]

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <label className="period-filter">
      기간
      <select className="period-filter__input" value={value} onChange={(e) => onChange(e.target.value as Period)}>
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
