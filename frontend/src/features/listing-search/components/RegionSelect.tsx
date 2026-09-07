import './RegionSelect.css'

interface RegionSelectProps {
  value: string
  cities: string[]
  onChange: (city: string) => void
}

export function RegionSelect({ value, cities, onChange }: RegionSelectProps) {
  return (
    <label className="region-select">
      지역
      <select className="region-select__input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">전체</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </label>
  )
}
