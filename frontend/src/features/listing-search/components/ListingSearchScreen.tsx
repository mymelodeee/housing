import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListings } from '../hooks/useListings'
import { PriceRangeFilter } from './PriceRangeFilter'
import { ListingCard } from './ListingCard'
import { MapView } from '../../../shared/map/MapView'
import './ListingSearchScreen.css'

const DEFAULT_MIN_PRICE = 70000
const DEFAULT_MAX_PRICE = 150000

export function ListingSearchScreen() {
  const [priceRange, setPriceRange] = useState({ minPrice: DEFAULT_MIN_PRICE, maxPrice: DEFAULT_MAX_PRICE })
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list')
  const navigate = useNavigate()
  const { data, isLoading, isError } = useListings(priceRange.minPrice, priceRange.maxPrice)

  const mapPoints = (data ?? []).map((listing) => ({
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
          <MapView listings={mapPoints} onMarkerClick={(id) => navigate(`/listings/${id}`)} />
        </div>
        <div className="listing-search-screen__list" data-mobile-visible={mobileView === 'list'}>
          {isLoading && <p>불러오는 중...</p>}
          {isError && <p role="alert">매물 목록을 불러오지 못했습니다.</p>}
          {!isLoading && !isError && data?.length === 0 && <p>조건에 맞는 매물이 0건입니다</p>}
          {!isLoading && !isError && data && data.length > 0 && (
            <div className="listing-search-screen__cards">
              {data.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onClick={(id) => navigate(`/listings/${id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
