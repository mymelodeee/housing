import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFavoriteComplexes } from '../hooks/useFavoriteComplexes'
import { useRemoveFavoriteComplex } from '../hooks/useRemoveFavoriteComplex'
import { useFavoritesSelectionStore } from '../store/favoritesSelectionStore'
import { useCreateComparisonSet } from '../../comparison/hooks/useCreateComparisonSet'
import { ComplexCard } from './ComplexCard'
import { FavoriteToggleButton } from './FavoriteToggleButton'
import { Modal } from '../../../shared/components/Modal'
import './FavoriteComplexesTab.css'

export function FavoriteComplexesTab() {
  const { data, isLoading, isError } = useFavoriteComplexes()
  const removeFavorite = useRemoveFavoriteComplex()
  const { selectedComplexIds, toggleComplexSelection, clearComplexSelection } = useFavoritesSelectionStore()
  const createComparisonSet = useCreateComparisonSet()
  const navigate = useNavigate()
  const [warningModal, setWarningModal] = useState<{ title: string; body: string } | null>(null)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError) return <p role="alert">즐겨찾기 목록을 불러오지 못했습니다.</p>
  if (!data || data.length === 0) return <p>즐겨찾기한 단지가 없습니다</p>

  function handleToggle(complexId: number) {
    if (!selectedComplexIds.has(complexId) && selectedComplexIds.size >= 5) {
      setWarningModal({ title: '선택 제한', body: '비교셋은 최대 5개까지 선택할 수 있습니다' })
      return
    }
    toggleComplexSelection(complexId)
  }

  function handleCompare() {
    if (selectedComplexIds.size < 2) {
      setWarningModal({ title: '선택 부족', body: '비교하려면 2개 이상 선택해야 합니다' })
      return
    }
    createComparisonSet.mutate(
      { targetType: 'complex', complexIds: [...selectedComplexIds] },
      {
        onSuccess: (result) => {
          navigate(`/comparison-sets/${result.id}`)
          clearComplexSelection()
        },
      },
    )
  }

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
        onClose={() => setWarningModal(null)}
      >
        {warningModal?.body}
      </Modal>
    </div>
  )
}
