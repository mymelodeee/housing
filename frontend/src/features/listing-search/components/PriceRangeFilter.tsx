import './PriceRangeFilter.css'

interface PriceRangeFilterProps {
  minPrice: number
  maxPrice: number
  onChange: (range: { minPrice: number; maxPrice: number }) => void
}

export function PriceRangeFilter({ minPrice, maxPrice, onChange }: PriceRangeFilterProps) {
  return (
    <div className="price-range-filter">
      <label className="price-range-filter__label">
        최소 매매가(만원)
        <input
          className="price-range-filter__input"
          type="number"
          min={70000}
          max={150000}
          value={minPrice}
          onChange={(e) => onChange({ minPrice: Number(e.target.value), maxPrice })}
        />
      </label>
      <label className="price-range-filter__label">
        최대 매매가(만원)
        <input
          className="price-range-filter__input"
          type="number"
          min={70000}
          max={150000}
          value={maxPrice}
          onChange={(e) => onChange({ minPrice, maxPrice: Number(e.target.value) })}
        />
      </label>
    </div>
  )
}
