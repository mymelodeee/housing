import './FavoriteToggleButton.css'

interface FavoriteToggleButtonProps {
  isFavorited: boolean
  onToggle: () => void
  disabled?: boolean
}

export function FavoriteToggleButton({ isFavorited, onToggle, disabled }: FavoriteToggleButtonProps) {
  return (
    <button
      type="button"
      className="favorite-toggle-button"
      data-favorited={isFavorited}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      onClick={onToggle}
      disabled={disabled}
    >
      {isFavorited ? '♥' : '♡'}
    </button>
  )
}
