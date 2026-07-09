import { createBrowserRouter } from 'react-router-dom'
import { ComparisonSetScreen } from '../features/comparison/components/ComparisonSetScreen'
import { FavoritesScreen } from '../features/favorites/components/FavoritesScreen'
import { ListingDetailScreen } from '../features/listing-detail/components/ListingDetailScreen'
import { ListingSearchScreen } from '../features/listing-search/components/ListingSearchScreen'
import { UserProfileForm } from '../features/user-profile/components/UserProfileForm'

export const router = createBrowserRouter([
  { path: '/', element: <ListingSearchScreen /> },
  { path: '/listings/:listingId', element: <ListingDetailScreen /> },
  { path: '/favorites', element: <FavoritesScreen /> },
  { path: '/comparison-sets/:id', element: <ComparisonSetScreen /> },
  { path: '/profile', element: <UserProfileForm /> },
])
