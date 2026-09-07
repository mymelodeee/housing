import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useListings } from '../hooks/useListings'
import { useRecentTransactions } from '../hooks/useRecentTransactions'
import { useSelectRecentTransactionComplex } from '../hooks/useSelectRecentTransactionComplex'
import { useRegionCities } from '../hooks/useRegionCities'
import { PriceRangeFilter } from './PriceRangeFilter'
import { RegionSelect } from './RegionSelect'
import { ComplexLocationCard } from './ComplexLocationCard'
import { RecentTransactionComplexGroup } from './RecentTransactionComplexGroup'
import { groupRecentTransactionsByComplex } from '../utils/groupRecentTransactionsByComplex'
import { dedupeComplexesFromListings } from '../utils/dedupeComplexesFromListings'
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

function readPriceParam(searchParams: URLSearchParams, key: string, fallback: number): number {
  const rawValue = searchParams.get(key)
  if (rawValue === null) return fallback
  const value = Number(rawValue)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

export function ListingSearchScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const priceRange = {
    minPrice: readPriceParam(searchParams, 'minPrice', DEFAULT_MIN_PRICE),
    maxPrice: readPriceParam(searchParams, 'maxPrice', DEFAULT_MAX_PRICE),
  }
  const city = searchParams.get('city') ?? ''
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list')
  const searchMode = searchParams.get('mode') === 'transactions' ? 'transactions' : 'registered'
  const [transactionErrorMessage, setTransactionErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const regionCities = useRegionCities()
  const { data, isLoading, isError } = useListings(priceRange.minPrice, priceRange.maxPrice, city)
  const recentTransactions = useRecentTransactions(priceRange.minPrice, priceRange.maxPrice, searchMode === 'transactions', city)
  const selectComplex = useSelectRecentTransactionComplex()
  const favoriteComplexes = useFavoriteComplexes()
  const addFavoriteComplex = useAddFavoriteComplex()
  const removeFavoriteComplex = useRemoveFavoriteComplex()
  const favoriteComplexIds = new Set((favoriteComplexes.data ?? []).map((favorite) => favorite.complexId))
  const { selectedComplexIds, handleToggle, handleCompare, warningModal, closeWarningModal } =
    useComplexComparisonSelection()

  function updateSearchParams(updates: Record<string, string | number | null>) {
    const nextParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) nextParams.delete(key)
      else nextParams.set(key, String(value))
    })
    setSearchParams(nextParams, { replace: true })
  }

  function handlePriceRangeChange(nextRange: { minPrice: number; maxPrice: number }) {
    updateSearchParams({
      minPrice: nextRange.minPrice === DEFAULT_MIN_PRICE ? null : nextRange.minPrice,
      maxPrice: nextRange.maxPrice === DEFAULT_MAX_PRICE ? null : nextRange.maxPrice,
    })
  }

  function handleCityChange(nextCity: string) {
    updateSearchParams({ city: nextCity || null })
  }

  function handleSearchModeChange(nextMode: 'registered' | 'transactions') {
    updateSearchParams({ mode: nextMode === 'registered' ? null : nextMode })
  }

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

  function handleSelectComplex(cacheId: number) {
    selectComplex.mutate(cacheId, {
      onSuccess: ({ complexId }) => navigate(`/complexes/${complexId}`),
      onError: (err) => {
        setTransactionErrorMessage(err instanceof ApiError ? err.message : '단지 정보를 가져오지 못했습니다.')
        if (import.meta.env.DEV) {
          console.error('[ERROR] 실거래 탐색 결과에서 단지 상세 진입 실패', err)
        }
      },
    })
  }

  const mapPoints =
    searchMode === 'transactions'
      ? (recentTransactions.data ?? [])
          .filter((entry) => entry.latitude !== null && entry.longitude !== null)
          .map((entry) => ({ id: entry.id, lat: entry.latitude as number, lng: entry.longitude as number }))
      : dedupeComplexesFromListings(data ?? []).map((complex) => ({
          id: complex.id,
          lat: complex.latitude,
          lng: complex.longitude,
        }))

  return (
    <div className="listing-search-screen">
      <div className="listing-search-screen__filters">
        <RegionSelect value={city} cities={regionCities.data?.cities ?? []} onChange={handleCityChange} />
        <PriceRangeFilter
          minPrice={priceRange.minPrice}
          maxPrice={priceRange.maxPrice}
          onChange={handlePriceRangeChange}
        />
      </div>
      <div className="listing-search-screen__mode-toggle">
        <button type="button" onClick={() => handleSearchModeChange('registered')} data-active={searchMode === 'registered'}>
          등록 매물
        </button>
        <button type="button" onClick={() => handleSearchModeChange('transactions')} data-active={searchMode === 'transactions'}>
          실거래 탐색
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
            onMarkerClick={(id) => {
              if (searchMode === 'transactions') handleSelectComplex(Number(id))
              else navigate(`/complexes/${id}`)
            }}
          />
        </div>
        <div className="listing-search-screen__list" data-mobile-visible={mobileView === 'list'}>
          {searchMode === 'transactions' && (
            <>
              {recentTransactions.isLoading && <p>불러오는 중...</p>}
              {recentTransactions.isError && <p role="alert">최근 실거래 목록을 불러오지 못했습니다.</p>}
              {!recentTransactions.isLoading && !recentTransactions.isError && recentTransactions.data?.length === 0 && (
                <p>조건에 맞는 매물이 0건입니다</p>
              )}
              {!recentTransactions.isLoading && !recentTransactions.isError && recentTransactions.data && recentTransactions.data.length > 0 && (
                <div className="listing-search-screen__cards">
                  {groupRecentTransactionsByComplex(recentTransactions.data).map((group) => (
                    <RecentTransactionComplexGroup key={group.key} group={group} onSelect={handleSelectComplex} />
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
              {dedupeComplexesFromListings(data).map((complex) => (
                <ComplexLocationCard
                  key={complex.id}
                  complex={complex}
                  onClick={() => navigate(`/complexes/${complex.id}`)}
                  favoriteSlot={
                    <ComplexFavoriteStar
                      isFavorited={favoriteComplexIds.has(complex.id)}
                      onToggle={() => handleToggleFavorite(complex.id)}
                    />
                  }
                  compareSlot={
                    <ComplexCompareToggle
                      isSelected={selectedComplexIds.has(complex.id)}
                      onToggle={() => handleToggle(complex.id)}
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
      <Modal open={transactionErrorMessage !== null} title="실거래 선택 실패" onClose={() => setTransactionErrorMessage(null)}>
        {transactionErrorMessage}
      </Modal>
    </div>
  )
}
