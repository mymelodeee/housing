const comparisonSetsRepository = require('../repositories/comparison-sets.repository');
const apartmentComplexesService = require('./apartment-complexes.service');
const listingsService = require('./listings.service');

function mapComplexItem(detail) {
  return {
    complexId: detail.id,
    complexName: detail.complexName,
    completionYear: detail.completionYear,
    remodelingStatus: detail.remodelingStatus,
    reconstructionStatus: detail.reconstructionStatus,
    nearbyRedevelopmentInfo: detail.nearbyRedevelopmentInfo,
    localityAttributes: detail.localityAttributes,
    shuttleCommuteMinutes: detail.shuttleCommuteMinutes,
    priceRange: detail.priceRange
  };
}

async function mapListingItem(listingDetail) {
  const complexDetail = await apartmentComplexesService.getComplexDetail(listingDetail.complexId);
  return {
    listingId: listingDetail.id,
    complexId: listingDetail.complexId,
    salePrice: listingDetail.salePrice,
    exclusiveArea: listingDetail.exclusiveArea,
    complexName: complexDetail.complexName,
    completionYear: complexDetail.completionYear,
    remodelingStatus: complexDetail.remodelingStatus,
    reconstructionStatus: complexDetail.reconstructionStatus,
    nearbyRedevelopmentInfo: complexDetail.nearbyRedevelopmentInfo,
    localityAttributes: complexDetail.localityAttributes,
    shuttleCommuteMinutes: complexDetail.shuttleCommuteMinutes
  };
}

async function getComparisonSetDetail(setId) {
  const set = await comparisonSetsRepository.findSetById(setId);
  if (!set) return null;

  if (set.target_type === 'complex') {
    const complexIds = await comparisonSetsRepository.findComplexIdsBySetId(setId);
    const details = await Promise.all(complexIds.map((id) => apartmentComplexesService.getComplexDetail(id)));
    return {
      id: set.id,
      userProfileId: set.user_profile_id,
      targetType: set.target_type,
      createdAt: set.created_at,
      complexes: details.map(mapComplexItem),
      listings: null
    };
  }

  const listingIds = await comparisonSetsRepository.findListingIdsBySetId(setId);
  const listingDetails = await Promise.all(listingIds.map((id) => listingsService.getListingDetail(id)));
  const items = await Promise.all(listingDetails.map(mapListingItem));
  return {
    id: set.id,
    userProfileId: set.user_profile_id,
    targetType: set.target_type,
    createdAt: set.created_at,
    complexes: null,
    listings: items
  };
}

module.exports = { getComparisonSetDetail };
