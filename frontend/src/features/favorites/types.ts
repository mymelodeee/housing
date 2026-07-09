import type { ApartmentComplexSummary, Listing } from '../../shared/types/listing'

export interface FavoriteComplex {
  id: number
  userProfileId: number
  complexId: number
  registeredAt: string
  complex: ApartmentComplexSummary
}

export interface FavoriteListing {
  id: number
  userProfileId: number
  listingId: number
  registeredAt: string
  listing: Listing
}
