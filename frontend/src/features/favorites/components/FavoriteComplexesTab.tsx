import { useFavoriteComplexes } from '../hooks/useFavoriteComplexes'
import { useRemoveFavoriteComplex } from '../hooks/useRemoveFavoriteComplex'
import { useComplexComparisonSelection } from '../../comparison/hooks/useComplexComparisonSelection'
import { ComplexCard } from './ComplexCard'
import { FavoriteToggleButton } from './FavoriteToggleButton'
import { Modal } from '../../../shared/components/Modal'
import './FavoriteComplexesTab.css'

export function FavoriteComplexesTab() {
  const { data, isLoading, isError } = useFavoriteComplexes()
  const removeFavorite = useRemoveFavoriteComplex()
  const { selectedComplexIds, handleToggle, handleCompare, warningModal, closeWarningModal } =
    useComplexComparisonSelection()

  if (isLoading) return <p>불러오는 중...</p>
  if (isError) return <p role="alert">즐겨찾기 목록을 불러오지 못했습니다.</p>
  if (!data || data.length === 0) return <p>즐겨찾기한 단지가 없습니다</p>

  return (
    <div className="favorite-complexes-tab">
      <button type="button" className="favorite-complexes-tab__compare-button" onClick={handleCompare}>
        비교하기
      </button>
      {data.map((favorite) => (
        <div className="favorite-complexes-tab__row" key={favorite.id}>
          <input
            type="checkbox"
            checked={selectedComplexIds.has(favorite.complexId)}
            onChange={() => handleToggle(favorite.complexId)}
            aria-label={`${favorite.complex.complexName} 선택`}
          />
          <ComplexCard
            complex={favorite.complex}
            favoriteSlot={
              <FavoriteToggleButton isFavorited onToggle={() => removeFavorite.mutate(favorite.complexId)} />
            }
          />
        </div>
      ))}
      <Modal
        open={warningModal !== null}
        title={warningModal?.title ?? ''}
        onClose={closeWarningModal}
      >
        {warningModal?.body}
      </Modal>
    </div>
  )
}
