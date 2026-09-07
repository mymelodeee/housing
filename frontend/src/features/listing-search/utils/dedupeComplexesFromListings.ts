import type { Listing, ListingComplex } from '../../../shared/types/listing'

export function dedupeComplexesFromListings(listings: Listing[]): ListingComplex[] {
  const seen = new Map<number, ListingComplex>()
  for (const listing of listings) {
    if (!seen.has(listing.complex.id)) {
      seen.set(listing.complex.id, listing.complex)
    }
  }
  return Array.from(seen.values())
}
