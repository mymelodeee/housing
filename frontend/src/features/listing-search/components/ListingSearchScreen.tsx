import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListings } from '../hooks/useListings'
import { useLiveListings } from '../hooks/useLiveListings'
import { useSelectLiveListing } from '../hooks/useSelectLiveListing'
import { PriceRangeFilter } from './PriceRangeFilter'
import { ListingCard } from './ListingCard'
import { LiveListingCard } from './LiveListingCard'
import { ComplexFavoriteStar } from './ComplexFavoriteStar'
import { ComplexCompareToggle } from './ComplexCompareToggle'
import { MapView } from '../../../shared/map/MapView'
import { useFavoriteComplexes } from '../../favorites/hooks/useFavoriteComplexes'
import { useAddFavoriteComplex } from '../../favorites/hooks/useAddFavoriteComplex'
import { useRemoveFavoriteComplex } from '../../favorites/hooks/useRemoveFavoriteComplex'
import { useComplexComparisonSelection } from '../../comparison/hooks/useComplexComparisonSelection'
import { ApiError } from '../../../shared/api/client'
import { Modal } from '../../../shared/components/Modal'
import './ListingSearchScreen.css'

const DEFAULT_MIN_PRICE = 70000
const DEFAULT_MAX_PRICE = 150000

export function ListingSearchScreen() {
  const [priceRange, setPriceRange] = useState({ minPrice: DEFAULT_MIN_PRICE, maxPrice: DEFAULT_MAX_PRICE })
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list')
  const [searchMode, setSearchMode] = useState<'registered' | 'live'>('registered')
  const [liveErrorMessage, setLiveErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const { data, isLoading, isError } = useListings(priceRange.minPrice, priceRange.maxPrice)
  const liveListings = useLiveListings(priceRange.minPrice, priceRange.maxPrice, searchMode === 'live')
  const selectLiveListing = useSelectLiveListing()
  const favoriteComplexes = useFavoriteComplexes()
  const addFavoriteComplex = useAddFavoriteComplex()
  const removeFavoriteComplex = useRemoveFavoriteComplex()
  const favoriteComplexIds = new Set((favoriteComplexes.data ?? []).map((favorite) => favorite.complexId))
  const { selectedComplexIds, handleToggle, handleCompare, warningModal, closeWarningModal } =
    useComplexComparisonSelection()

  function handleToggleFavorite(complexId: number) {
    const mutation = favoriteComplexIds.has(complexId) ? removeFavoriteComplex : addFavoriteComplex
    mutation.mutate(complexId, {
      onError: (err) => {
        if (import.meta.env.DEV) {
          const message = err instanceof ApiError ? err.message : err
          console.error('[ERROR] 단지 즐겨찾기 처리 실패', message)
        }
      },
    })
  }

  function handleSelectLiveListing(cacheId: number) {
    selectLiveListing.mutate(cacheId, {
      onSuccess: ({ listingId }) => navigate(`/listings/${listingId}`),
      onError: (err) => {
        setLiveErrorMessage(err instanceof ApiError ? err.message : '매물을 가져오지 못했습니다.')
        if (import.meta.env.DEV) {
          console.error('[ERROR] 실시간 매물 선택 실패', err)
        }
      },
    })
  }

  const mapPoints =
    searchMode === 'live'
      ? (liveListings.data ?? [])
          .filter((entry) => entry.latitude !== null && entry.longitude !== null)
          .map((entry) => ({ id: entry.id, lat: entry.latitude as number, lng: entry.longitude as number }))
      : (data ?? []).map((listing) => ({
          id: listing.id,
          lat: listing.complex.latitude,
          lng: listing.complex.longitude,
        }))

  return (
    <div className="listing-search-screen">
      <PriceRangeFilter
        minPrice={priceRange.minPrice}
        maxPrice={priceRange.maxPrice}
        onChange={setPriceRange}
      />
      <div className="listing-search-screen__mode-toggle">
        <button type="button" onClick={() => setSearchMode('registered')} data-active={searchMode === 'registered'}>
          등록 매물
        </button>
        <button type="button" onClick={() => setSearchMode('live')} data-active={searchMode === 'live'}>
          실시간 탐색
        </button>
      </div>
      <div className="listing-search-screen__mobile-toggle">
        <button type="button" onClick={() => setMobileView('map')} data-active={mobileView === 'map'}>
          지도
        </button>
        <button type="button" onClick={() => setMobileView('list')} data-active={mobileView === 'list'}>
          목록
        </button>
      </div>
      <div className="listing-search-screen__body">
        <div className="listing-search-screen__map" data-mobile-visible={mobileView === 'map'}>
          <MapView
            listings={mapPoints}
            onMarkerClick={(id) =>
              searchMode === 'live' ? handleSelectLiveListing(Number(id)) : navigate(`/listings/${id}`)
            }
          />
        </div>
        <div className="listing-search-screen__list" data-mobile-visible={mobileView === 'list'}>
          {searchMode === 'live' && (
            <>
              {liveListings.isLoading && <p>불러오는 중...</p>}
              {liveListings.isError && <p role="alert">실시간 매물 목록을 불러오지 못했습니다.</p>}
              {!liveListings.isLoading && !liveListings.isError && liveListings.data?.length === 0 && (
                <p>조건에 맞는 매물이 0건입니다</p>
              )}
              {!liveListings.isLoading && !liveListings.isError && liveListings.data && liveListings.data.length > 0 && (
                <div className="listing-search-screen__cards">
                  {liveListings.data.map((entry) => (
                    <LiveListingCard key={entry.id} entry={entry} onSelect={handleSelectLiveListing} />
                  ))}
                </div>
              )}
            </>
          )}
          {searchMode === 'registered' && isLoading && <p>불러오는 중...</p>}
          {searchMode === 'registered' && isError && <p role="alert">매물 목록을 불러오지 못했습니다.</p>}
          {searchMode === 'registered' && !isLoading && !isError && data?.length === 0 && (
            <p>조건에 맞는 매물이 0건입니다</p>
          )}
          {searchMode === 'registered' && !isLoading && !isError && data && data.length > 0 && (
            <div className="listing-search-screen__cards">
              {data.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={(id) => navigate(`/listings/${id}`)}
                  favoriteSlot={
                    <ComplexFavoriteStar
                      isFavorited={favoriteComplexIds.has(listing.complex.id)}
                      onToggle={() => handleToggleFavorite(listing.complex.id)}
                    />
                  }
                  compareSlot={
                    <ComplexCompareToggle
                      isSelected={selectedComplexIds.has(listing.complex.id)}
                      onToggle={() => handleToggle(listing.complex.id)}
                    />
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedComplexIds.size > 0 && (
        <div className="listing-search-screen__compare-bar">
          <span className="listing-search-screen__compare-count">{selectedComplexIds.size}개 선택됨</span>
          <button type="button" className="listing-search-screen__compare-button" onClick={handleCompare}>
            비교하기
          </button>
        </div>
      )}
      <Modal open={warningModal !== null} title={warningModal?.title ?? ''} onClose={closeWarningModal}>
        {warningModal?.body}
      </Modal>
      <Modal open={liveErrorMessage !== null} title="실시간 매물 선택 실패" onClose={() => setLiveErrorMessage(null)}>
        {liveErrorMessage}
      </Modal>
    </div>
  )
}
