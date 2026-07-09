const favoriteComplexesRepository = require('../repositories/favorite-complexes.repository');
const favoriteListingsRepository = require('../repositories/favorite-listings.repository');
const apartmentComplexesService = require('./apartment-complexes.service');

const USER_PROFILE_ID = 1;

function mapFavoriteComplexRow(row) {
  return {
    id: row.id,
    userProfileId: row.user_profile_id,
    complexId: row.complex_id,
    registeredAt: row.registered_at,
    complex: apartmentComplexesService.mapSummaryFields({
      id: row.c_id,
      complex_name: row.complex_name,
      address: row.address,
      completion_year: row.completion_year,
      remodeling_status: row.remodeling_status,
      reconstruction_status: row.reconstruction_status,
      is_regulated_area: row.is_regulated_area,
      is_land_transaction_permission_zone: row.is_land_transaction_permission_zone,
      nearest_shuttle_stop_name: row.nearest_shuttle_stop_name,
      nearest_shuttle_stop_distance: row.nearest_shuttle_stop_distance,
      shuttle_commute_minutes: row.shuttle_commute_minutes
    })
  };
}

function mapFavoriteListingRow(row) {
  return {
    id: row.id,
    userProfileId: row.user_profile_id,
    listingId: row.listing_id,
    registeredAt: row.registered_at,
    listing: {
      id: row.l_id,
      complexId: row.complex_id,
      salePrice: row.sale_price,
      exclusiveArea: row.exclusive_area,
      complex: apartmentComplexesService.mapSummaryFields({
        id: row.c_id,
        complex_name: row.complex_name,
        address: row.address,
        completion_year: row.completion_year,
        remodeling_status: row.remodeling_status,
        reconstruction_status: row.reconstruction_status,
        is_regulated_area: row.is_regulated_area,
        is_land_transaction_permission_zone: row.is_land_transaction_permission_zone,
        nearest_shuttle_stop_name: row.nearest_shuttle_stop_name,
        nearest_shuttle_stop_distance: row.nearest_shuttle_stop_distance,
        shuttle_commute_minutes: row.shuttle_commute_minutes
      })
    }
  };
}

async function addComplexFavorite(complexId) {
  const row = await favoriteComplexesRepository.insert(USER_PROFILE_ID, complexId);
  return { id: row.id, userProfileId: row.user_profile_id, complexId: row.complex_id, registeredAt: row.registered_at };
}

async function addListingFavorite(listingId) {
  const row = await favoriteListingsRepository.insert(USER_PROFILE_ID, listingId);
  return { id: row.id, userProfileId: row.user_profile_id, listingId: row.listing_id, registeredAt: row.registered_at };
}

async function removeComplexFavorite(complexId) {
  return favoriteComplexesRepository.remove(USER_PROFILE_ID, complexId);
}

async function removeListingFavorite(listingId) {
  return favoriteListingsRepository.remove(USER_PROFILE_ID, listingId);
}

async function listComplexFavorites() {
  const rows = await favoriteComplexesRepository.findAllByUserProfileId(USER_PROFILE_ID);
  return rows.map(mapFavoriteComplexRow);
}

async function listListingFavorites() {
  const rows = await favoriteListingsRepository.findAllByUserProfileId(USER_PROFILE_ID);
  return rows.map(mapFavoriteListingRow);
}

module.exports = {
  addComplexFavorite, addListingFavorite,
  removeComplexFavorite, removeListingFavorite,
  listComplexFavorites, listListingFavorites
};
