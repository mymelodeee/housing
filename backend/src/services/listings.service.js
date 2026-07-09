const listingsRepository = require('../repositories/listings.repository');
const apartmentComplexesService = require('./apartment-complexes.service');
const priceHistoryService = require('./price-history.service');
const apartmentComplexesRepository = require('../repositories/apartment-complexes.repository');
const regulationService = require('./regulation.service');
const loanLimitService = require('./loan-limit.service');
const userProfileService = require('./user-profile.service');
const loanScenarioService = require('./loan-scenario.service');

const DEFAULT_MIN_PRICE = 70000;
const DEFAULT_MAX_PRICE = 150000;
const POLICY_MORTGAGE_NOTICE = '디딤돌대출·보금자리론 등 정책모기지는 계산 범위에서 제외되며, 필요 시 한국주택금융공사·주택도시기금 채널에서 별도 확인이 필요합니다.';

function mapListingRow(row) {
  return {
    id: row.id,
    complexId: row.complex_id,
    salePrice: row.sale_price,
    exclusiveArea: row.exclusive_area,
    complex: {
      ...apartmentComplexesService.mapSummaryFields({
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
      }),
      latitude: row.latitude,
      longitude: row.longitude
    }
  };
}

async function listListings({ minPrice, maxPrice, minLat, maxLat, minLng, maxLng } = {}) {
  const rows = await listingsRepository.findByPriceRange({
    minPrice: minPrice === undefined ? DEFAULT_MIN_PRICE : minPrice,
    maxPrice: maxPrice === undefined ? DEFAULT_MAX_PRICE : maxPrice,
    minLat, maxLat, minLng, maxLng
  });
  return rows.map(mapListingRow);
}

async function getListingDetail(id) {
  const row = await listingsRepository.findByIdWithComplex(id);
  if (!row) return null;
  return mapListingRow(row);
}

async function getListingLocality(id) {
  const listing = await getListingDetail(id);
  if (!listing) return null;

  const complexDetail = await apartmentComplexesService.getComplexDetail(listing.complexId);

  return {
    listingId: listing.id,
    complexId: listing.complexId,
    completionYear: complexDetail.completionYear,
    remodelingStatus: complexDetail.remodelingStatus,
    reconstructionStatus: complexDetail.reconstructionStatus,
    nearbyRedevelopmentInfo: complexDetail.nearbyRedevelopmentInfo,
    localityAttributes: complexDetail.localityAttributes
  };
}

async function getPriceHistory(id) {
  const listingRow = await listingsRepository.findByIdWithComplex(id);
  if (!listingRow) return null;

  const rows = await apartmentComplexesRepository.findPriceHistoryByComplexId(listingRow.complex_id);
  const { lookupPeriodType, firstTransactionMonth, entries } = priceHistoryService.buildPriceHistoryResult({
    rows,
    completionYear: listingRow.completion_year
  });

  return {
    listingId: listingRow.id,
    complexId: listingRow.complex_id,
    lookupPeriodType,
    firstTransactionMonth,
    entries
  };
}

async function getListingRegulation(id) {
  const listingRow = await listingsRepository.findByIdWithComplex(id);
  if (!listingRow) return null;

  const isRegulatedArea = listingRow.is_regulated_area;
  const isLandTransactionPermissionZoneRaw = listingRow.is_land_transaction_permission_zone;
  const regulationConfirmationNeeded = isLandTransactionPermissionZoneRaw === null;
  const isLandTransactionPermissionZone =
    regulationService.mapLandTransactionZoneStatus(isLandTransactionPermissionZoneRaw);

  const effectiveIsRegulatedAreaForLoan = regulationConfirmationNeeded ? false : isRegulatedArea;

  const profile = await userProfileService.getProfile();
  const profileComplete = profile.housingOwnershipTier !== null;

  let ltvPercent = null;
  let maxLoanAmount = null;
  let profileMessage = null;
  let isMortgageInRegulatedArea = false;

  if (profileComplete) {
    const loanLimit = loanLimitService.calculateMaxLoanAmount({
      salePrice: listingRow.sale_price,
      housingOwnershipTier: profile.housingOwnershipTier,
      isFirstTimeBuyer: profile.isFirstTimeBuyer,
      isRegulatedArea: effectiveIsRegulatedAreaForLoan,
      annualIncome: profile.annualIncome,
      annualBonus: profile.annualBonus
    });
    ltvPercent = loanLimit.ltvPercent;
    maxLoanAmount = loanLimit.maxLoanAmount;
    isMortgageInRegulatedArea = isRegulatedArea && maxLoanAmount > 0;
  } else {
    profileMessage = '내 정보 입력 필요';
  }

  return {
    listingId: listingRow.id,
    complexId: listingRow.complex_id,
    isRegulatedArea,
    isLandTransactionPermissionZone,
    regulationConfirmationNeeded,
    ltvPercent,
    maxLoanAmount,
    profileMessage,
    gapInvestmentAllowed: regulationService.determineGapInvestmentAllowed({
      isLandTransactionPermissionZone: isLandTransactionPermissionZoneRaw,
      isMortgageInRegulatedArea
    }),
    occupancyRequirementMonths: regulationService.determineOccupancyRequirementMonths({
      isLandTransactionPermissionZone: isLandTransactionPermissionZoneRaw,
      isMortgageInRegulatedArea
    }),
    regionalLoanCapAmount: regulationService.getRegionalLoanCapAmount(isRegulatedArea)
  };
}

async function getListingLoanSimulation(id) {
  const listingRow = await listingsRepository.findByIdWithComplex(id);
  if (!listingRow) return null;

  const profile = await userProfileService.getProfile();
  if (profile.housingOwnershipTier === null) {
    return {
      listingId: listingRow.id,
      profileIncomplete: true,
      scenarios: null,
      recommendedScenario: null,
      policyMortgageNotice: POLICY_MORTGAGE_NOTICE
    };
  }

  const regulationConfirmationNeeded = listingRow.is_land_transaction_permission_zone === null;
  const effectiveIsRegulatedAreaForLoan = regulationConfirmationNeeded ? false : listingRow.is_regulated_area;

  const scenarios = loanScenarioService.buildScenarios({
    salePrice: listingRow.sale_price,
    isRegulatedArea: effectiveIsRegulatedAreaForLoan,
    annualIncome: profile.annualIncome,
    annualBonus: profile.annualBonus,
    availableCapital: profile.availableCapital,
    isLandTransactionPermissionZone: listingRow.is_land_transaction_permission_zone
  });
  const recommendedScenario = loanScenarioService.selectRecommendedScenario(scenarios);

  return {
    listingId: listingRow.id,
    profileIncomplete: false,
    scenarios,
    recommendedScenario,
    policyMortgageNotice: POLICY_MORTGAGE_NOTICE
  };
}

module.exports = {
  listListings,
  getListingDetail,
  getListingLocality,
  getPriceHistory,
  getListingRegulation,
  getListingLoanSimulation
};
