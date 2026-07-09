import { useState } from 'react'
import { FavoriteComplexesTab } from './FavoriteComplexesTab'
import { FavoriteListingsTab } from './FavoriteListingsTab'
import './FavoritesScreen.css'

type FavoritesTabKey = 'complexes' | 'listings'

export function FavoritesScreen() {
  const [activeTab, setActiveTab] = useState<FavoritesTabKey>('complexes')

  return (
    <div className="favorites-screen">
      <div role="tablist" className="favorites-screen__tabs">
        <button
          type="button"
          role="tab"
          id="favorites-tab-complexes"
          aria-selected={activeTab === 'complexes'}
          aria-controls="favorites-tabpanel-complexes"
          data-active={activeTab === 'complexes'}
          className="favorites-screen__tab"
          onClick={() => setActiveTab('complexes')}
        >
          단지 즐겨찾기
        </button>
        <button
          type="button"
          role="tab"
          id="favorites-tab-listings"
          aria-selected={activeTab === 'listings'}
          aria-controls="favorites-tabpanel-listings"
          data-active={activeTab === 'listings'}
          className="favorites-screen__tab"
          onClick={() => setActiveTab('listings')}
        >
          매물 즐겨찾기
        </button>
      </div>
      <div
        role="tabpanel"
        id="favorites-tabpanel-complexes"
        aria-labelledby="favorites-tab-complexes"
        hidden={activeTab !== 'complexes'}
      >
        <FavoriteComplexesTab />
      </div>
      <div
        role="tabpanel"
        id="favorites-tabpanel-listings"
        aria-labelledby="favorites-tab-listings"
        hidden={activeTab !== 'listings'}
      >
        <FavoriteListingsTab />
      </div>
    </div>
  )
}
