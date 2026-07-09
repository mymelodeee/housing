import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListingCard } from '../../listing-search/components/ListingCard'
import { useFavoriteListings } from '../hooks/useFavoriteListings'
import { useRemoveFavoriteListing } from '../hooks/useRemoveFavoriteListing'
import { useFavoritesSelectionStore } from '../store/favoritesSelectionStore'
import { useCreateComparisonSet } from '../../comparison/hooks/useCreateComparisonSet'
import { FavoriteToggleButton } from './FavoriteToggleButton'
import { Modal } from '../../../shared/components/Modal'
import './FavoriteListingsTab.css'

export function FavoriteListingsTab() {
  const { data, isLoading, isError } = useFavoriteListings()
  const removeFavorite = useRemoveFavoriteListing()
  const { selectedListingIds, toggleListingSelection, clearListingSelection } = useFavoritesSelectionStore()
  const createComparisonSet = useCreateComparisonSet()
  const navigate = useNavigate()
  const [warningModal, setWarningModal] = useState<{ title: string; body: string } | null>(null)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError) return <p role="alert">즐겨찾기 목록을 불러오지 못했습니다.</p>
  if (!data || data.length === 0) return <p>즐겨찾기한 매물이 없습니다</p>

  function handleToggle(listingId: number) {
    if (!selectedListingIds.has(listingId) && selectedListingIds.size >= 5) {
      setWarningModal({ title: '선택 제한', body: '비교셋은 최대 5개까지 선택할 수 있습니다' })
      return
    }
    toggleListingSelection(listingId)
  }

  function handleCompare() {
    if (selectedListingIds.size < 2) {
      setWarningModal({ title: '선택 부족', body: '비교하려면 2개 이상 선택해야 합니다' })
      return
    }
    createComparisonSet.mutate(
      { targetType: 'listing', listingIds: [...selectedListingIds] },
      {
        onSuccess: (result) => {
          navigate(`/comparison-sets/${result.id}`)
          clearListingSelection()
        },
      },
    )
  }

  return (
    <div className="favorite-listings-tab">
      <button type="button" className="favorite-listings-tab__compare-button" onClick={handleCompare}>
        비교하기
      </button>
      {data.map((favorite) => (
        <div className="favorite-listings-tab__row" key={favorite.id}>
          <input
            type="checkbox"
            checked={selectedListingIds.has(favorite.listingId)}
            onChange={() => handleToggle(favorite.listingId)}
            aria-label={`${favorite.listing.complex.complexName} 매물 선택`}
          />
          <ListingCard
            listing={favorite.listing}
            favoriteSlot={
              <FavoriteToggleButton isFavorited onToggle={() => removeFavorite.mutate(favorite.listingId)} />
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
