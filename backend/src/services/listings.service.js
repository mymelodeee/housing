const listingsRepository = require('../repositories/listings.repository');
const { getTargetRegionCodes, getLawdCdsByCity, getCities } = require('../config/target-regions');
const apartmentComplexesService = require('./apartment-complexes.service');
const priceHistoryService = require('./price-history.service');
const molitPriceHistoryService = require('./molit-price-history.service');
const jeonseHistoryService = require('./jeonse-history.service');
const elementarySchoolService = require('./elementary-school.service');
const apartmentComplexesRepository = require('../repositories/apartment-complexes.repository');
const regulationService = require('./regulation.service');
const loanLimitService = require('./loan-limit.service');
const userProfileService = require('./user-profile.service');
const loanScenarioService = require('./loan-scenario.service');
const remodelingService = require('./remodeling.service');
const remodelingRepository = require('../repositories/remodeling.repository');

const DEFAULT_MIN_PRICE = 70000;
const DEFAULT_MAX_PRICE = 150000;
const POLICY_MORTGAGE_NOTICE = '디딤돌대출·보금자리론 등 정책모기지는 계산 범위에서 제외되며, 필요 시 한국주택금융공사·주택도시기금 채널에서 별도 확인이 필요합니다.';
const LOOKUP_WINDOW_NOTE = '실시간 연동 특성상 최근 3년(36개월) 범위만 조회합니다';

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

async function listListings({ minPrice, maxPrice, minLat, maxLat, minLng, maxLng, city } = {}) {
  const rows = await listingsRepository.findByPriceRange({
    minPrice: minPrice === undefined ? DEFAULT_MIN_PRICE : minPrice,
    maxPrice: maxPrice === undefined ? DEFAULT_MAX_PRICE : maxPrice,
    minLat, maxLat, minLng, maxLng,
    targetLawdCds: city ? getLawdCdsByCity(city) : getTargetRegionCodes()
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

  if (listingRow.lawd_cd && listingRow.molit_apt_name) {
    const { lookupPeriodType, firstTransactionMonth, entries } =
      await molitPriceHistoryService.fetchPriceHistoryForComplex({
        lawdCd: listingRow.lawd_cd,
        aptName: listingRow.molit_apt_name
      });

    return {
      listingId: listingRow.id,
      complexId: listingRow.complex_id,
      lookupPeriodType,
      firstTransactionMonth,
      entries,
      lookupWindowNote: LOOKUP_WINDOW_NOTE
    };
  }

  const rows = await apartmentComplexesRepository.findPriceHistoryByComplexId(listingRow.complex_id);
  const { lookupPeriodType, firstTransactionMonth, entries } = priceHistoryService.buildPriceHistoryResult({ rows });

  return {
    listingId: listingRow.id,
    complexId: listingRow.complex_id,
    lookupPeriodType,
    firstTransactionMonth,
    entries
  };
}

async function getJeonseHistory(id) {
  const listingRow = await listingsRepository.findByIdWithComplex(id);
  if (!listingRow) return null;

  if (!listingRow.lawd_cd || !listingRow.molit_apt_name) {
    return {
      listingId: listingRow.id,
      complexId: listingRow.complex_id,
      saleEntries: [],
      jeonseEntries: [],
      ratioEntries: [],
      lookupWindowNote: LOOKUP_WINDOW_NOTE
    };
  }

  // 공공데이터포털 초당 요청 제한 때문에 매매/전세 조회를 동시에 실행하지 않고 순차 실행한다.
  const saleResult = await molitPriceHistoryService.fetchPriceHistoryForComplex({
    lawdCd: listingRow.lawd_cd,
    aptName: listingRow.molit_apt_name
  });
  const jeonseEntries = await jeonseHistoryService.fetchJeonseTransactionsForComplex({
    lawdCd: listingRow.lawd_cd,
    aptName: listingRow.molit_apt_name
  });

  return {
    listingId: listingRow.id,
    complexId: listingRow.complex_id,
    saleEntries: saleResult.entries,
    jeonseEntries,
    ratioEntries: jeonseHistoryService.buildJeonseRatioEntries({
      saleEntries: saleResult.entries,
      jeonseEntries
    }),
    lookupWindowNote: LOOKUP_WINDOW_NOTE
  };
}

const ASSIGNMENT_NOTE =
  '최근접 학교 기준 근사치이며, 실제 배정은 교육청 학구도에 따라 달라질 수 있습니다';

async function getAssignedSchools(id) {
  const listingRow = await listingsRepository.findByIdWithComplex(id);
  if (!listingRow) return null;

  if (listingRow.latitude === null || listingRow.longitude === null) {
    return {
      listingId: listingRow.id,
      complexId: listingRow.complex_id,
      elementarySchool: null,
      middleSchool: null,
      assignmentNote: ASSIGNMENT_NOTE
    };
  }

  const [elementarySchool, middleSchool] = await Promise.all([
    elementarySchoolService.findNearestSchoolByLevel(listingRow.latitude, listingRow.longitude, '초등학교'),
    elementarySchoolService.findNearestSchoolByLevel(listingRow.latitude, listingRow.longitude, '중학교')
  ]);

  return {
    listingId: listingRow.id,
    complexId: listingRow.complex_id,
    elementarySchool,
    middleSchool,
    assignmentNote: ASSIGNMENT_NOTE
  };
}

async function resolveRemodelingProject(listingRow) {
  return remodelingRepository.findProjectByComplexId(listingRow.complex_id);
}

async function getRemodeling(id) {
  const listingRow = await listingsRepository.findByIdWithComplex(id);
  if (!listingRow) return null;

  const project = await resolveRemodelingProject(listingRow);
  if (!project) {
    return remodelingService.buildNoProjectResponse({
      listingId: listingRow.id,
      complexId: listingRow.complex_id
    });
  }

  // 실거래가는 새로 구현하지 않고 기존 매매가 변동 이력 결과를 재사용한다.
  let priceEntries = [];
  try {
    const priceHistory = await getPriceHistory(id);
    priceEntries = (priceHistory && priceHistory.entries) || [];
  } catch (err) {
    priceEntries = [];
  }

  return remodelingService.getProjectView({
    listingId: listingRow.id,
    complexId: listingRow.complex_id,
    project,
    priceEntries
  });
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
    isMortgageInRegulatedArea = effectiveIsRegulatedAreaForLoan && maxLoanAmount > 0;
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
    regionalLoanCapAmount: regulationService.getRegionalLoanCapAmount(effectiveIsRegulatedAreaForLoan)
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
  getCities,
  getListingDetail,
  getListingLocality,
  getPriceHistory,
  getJeonseHistory,
  getAssignedSchools,
  getRemodeling,
  getListingRegulation,
  getListingLoanSimulation
};
