import './ComplexCompareToggle.css'

interface ComplexCompareToggleProps {
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
}

export function ComplexCompareToggle({ isSelected, onToggle, disabled }: ComplexCompareToggleProps) {
  return (
    <button
      type="button"
      className="complex-compare-toggle"
      data-selected={isSelected}
      aria-pressed={isSelected}
      aria-label={isSelected ? '비교셋에서 제거' : '비교셋에 추가'}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      disabled={disabled}
    >
      {isSelected ? '✓ 비교' : '+ 비교'}
    </button>
  )
}
