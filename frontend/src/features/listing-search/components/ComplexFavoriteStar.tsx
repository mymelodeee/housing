import './ComplexFavoriteStar.css'

interface ComplexFavoriteStarProps {
  isFavorited: boolean
  onToggle: () => void
  disabled?: boolean
}

export function ComplexFavoriteStar({ isFavorited, onToggle, disabled }: ComplexFavoriteStarProps) {
  return (
    <button
      type="button"
      className="complex-favorite-star"
      data-favorited={isFavorited}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      disabled={disabled}
    >
      {isFavorited ? '★' : '☆'}
    </button>
  )
}
