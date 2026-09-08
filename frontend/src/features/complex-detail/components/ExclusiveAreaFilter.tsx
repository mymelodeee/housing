import './ExclusiveAreaFilter.css'

interface ExclusiveAreaFilterProps {
  areas: number[]
  value: number | null
  onChange: (area: number | null) => void
}

export function ExclusiveAreaFilter({ areas, value, onChange }: ExclusiveAreaFilterProps) {
  return (
    <label className="exclusive-area-filter">
      평형(전용면적)
      <select
        className="exclusive-area-filter__input"
        value={value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      >
        <option value="">전체</option>
        {areas.map((area) => (
          <option key={area} value={area}>
            {area}m²
          </option>
        ))}
      </select>
    </label>
  )
}
