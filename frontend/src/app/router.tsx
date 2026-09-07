import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../shared/components/AppLayout'
import { ComparisonSetListScreen } from '../features/comparison/components/ComparisonSetListScreen'
import { ComparisonSetScreen } from '../features/comparison/components/ComparisonSetScreen'
import { FavoritesScreen } from '../features/favorites/components/FavoritesScreen'
import { ListingDetailScreen } from '../features/listing-detail/components/ListingDetailScreen'
import { ComplexDetailScreen } from '../features/complex-detail/components/ComplexDetailScreen'
import { ListingSearchScreen } from '../features/listing-search/components/ListingSearchScreen'
import { UserProfileForm } from '../features/user-profile/components/UserProfileForm'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <ListingSearchScreen /> },
      { path: '/listings/:listingId', element: <ListingDetailScreen /> },
      { path: '/complexes/:complexId', element: <ComplexDetailScreen /> },
      { path: '/favorites', element: <FavoritesScreen /> },
      { path: '/comparison-sets', element: <ComparisonSetListScreen /> },
      { path: '/comparison-sets/:id', element: <ComparisonSetScreen /> },
      { path: '/profile', element: <UserProfileForm /> },
    ],
  },
])
