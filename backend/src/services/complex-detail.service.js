const apartmentComplexesRepository = require('../repositories/apartment-complexes.repository');
const priceHistoryService = require('./price-history.service');
const molitPriceHistoryService = require('./molit-price-history.service');
const jeonseHistoryService = require('./jeonse-history.service');
const elementarySchoolService = require('./elementary-school.service');
const regulationService = require('./regulation.service');
const loanLimitService = require('./loan-limit.service');
const userProfileService = require('./user-profile.service');
const loanScenarioService = require('./loan-scenario.service');
const remodelingService = require('./remodeling.service');
const remodelingRepository = require('../repositories/remodeling.repository');

const POLICY_MORTGAGE_NOTICE = '디딤돌대출·보금자리론 등 정책모기지는 계산 범위에서 제외되며, 필요 시 한국주택금융공사·주택도시기금 채널에서 별도 확인이 필요합니다.';
const LOOKUP_WINDOW_NOTE = '실시간 연동 특성상 최근 3년(36개월) 범위만 조회합니다';
const ASSIGNMENT_NOTE = '최근접 학교 기준 근사치이며, 실제 배정은 교육청 학구도에 따라 달라질 수 있습니다';

async function getPriceHistory(complexId) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  if (complexRow.lawd_cd && complexRow.molit_apt_name) {
    const { lookupPeriodType, firstTransactionMonth, entries } =
      await molitPriceHistoryService.fetchPriceHistoryForComplex({
        lawdCd: complexRow.lawd_cd,
        aptName: complexRow.molit_apt_name
      });

    return { complexId, lookupPeriodType, firstTransactionMonth, entries, lookupWindowNote: LOOKUP_WINDOW_NOTE };
  }

  const rows = await apartmentComplexesRepository.findPriceHistoryByComplexId(complexId);
  const { lookupPeriodType, firstTransactionMonth, entries } = priceHistoryService.buildPriceHistoryResult({ rows });

  return { complexId, lookupPeriodType, firstTransactionMonth, entries };
}

async function getJeonseHistory(complexId) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  if (!complexRow.lawd_cd || !complexRow.molit_apt_name) {
    return { complexId, saleEntries: [], jeonseEntries: [], ratioEntries: [], lookupWindowNote: LOOKUP_WINDOW_NOTE };
  }

  // 공공데이터포털 초당 요청 제한 때문에 매매/전세 조회를 동시에 실행하지 않고 순차 실행한다.
  const saleResult = await molitPriceHistoryService.fetchPriceHistoryForComplex({
    lawdCd: complexRow.lawd_cd,
    aptName: complexRow.molit_apt_name
  });
  const jeonseEntries = await jeonseHistoryService.fetchJeonseTransactionsForComplex({
    lawdCd: complexRow.lawd_cd,
    aptName: complexRow.molit_apt_name
  });

  return {
    complexId,
    saleEntries: saleResult.entries,
    jeonseEntries,
    ratioEntries: jeonseHistoryService.buildJeonseRatioEntries({ saleEntries: saleResult.entries, jeonseEntries }),
    lookupWindowNote: LOOKUP_WINDOW_NOTE
  };
}

async function getAssignedSchools(complexId) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  if (complexRow.latitude === null || complexRow.longitude === null) {
    return { complexId, elementarySchool: null, middleSchool: null, assignmentNote: ASSIGNMENT_NOTE };
  }

  const [elementarySchool, middleSchool] = await Promise.all([
    elementarySchoolService.findNearestSchoolByLevel(complexRow.latitude, complexRow.longitude, '초등학교'),
    elementarySchoolService.findNearestSchoolByLevel(complexRow.latitude, complexRow.longitude, '중학교')
  ]);

  return { complexId, elementarySchool, middleSchool, assignmentNote: ASSIGNMENT_NOTE };
}

async function getRemodeling(complexId) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  const project = await remodelingRepository.findProjectByComplexId(complexId);

  if (!project) {
    return remodelingService.buildNoProjectResponse({ complexId });
  }

  let priceEntries = [];
  try {
    const priceHistory = await getPriceHistory(complexId);
    priceEntries = (priceHistory && priceHistory.entries) || [];
  } catch {
    priceEntries = [];
  }

  return remodelingService.getProjectView({ complexId, project, priceEntries });
}

// 사용자가 매매가를 직접 입력하지 않으면 해당 단지의 최신 유효 매매 실거래가를 자동 기준가격으로 사용한다.
// "현재 매물 호가"가 아니라 과거 확정 실거래이므로, 응답에 거래일(referenceTransactionDate)을 함께 내려
// 화면에서 시점을 명확히 표시할 수 있게 한다.
async function resolveEffectiveSalePrice(complexId, salePrice) {
  if (typeof salePrice === 'number' && !Number.isNaN(salePrice)) {
    return { effectiveSalePrice: salePrice, salePriceSource: 'user', referenceTransactionDate: null };
  }

  let entries = [];
  try {
    const priceHistory = await getPriceHistory(complexId);
    entries = (priceHistory && priceHistory.entries) || [];
  } catch {
    entries = [];
  }

  if (entries.length === 0) {
    return { effectiveSalePrice: null, salePriceSource: null, referenceTransactionDate: null };
  }

  const latest = entries[entries.length - 1];
  return {
    effectiveSalePrice: latest.transactionPrice,
    salePriceSource: 'transaction',
    referenceTransactionDate: latest.transactionDate
  };
}

async function getRegulation(complexId, { salePrice } = {}) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  const isRegulatedArea = complexRow.is_regulated_area;
  const isLandTransactionPermissionZoneRaw = complexRow.is_land_transaction_permission_zone;
  const regulationConfirmationNeeded = isLandTransactionPermissionZoneRaw === null;
  const isLandTransactionPermissionZone = regulationService.mapLandTransactionZoneStatus(isLandTransactionPermissionZoneRaw);
  const effectiveIsRegulatedAreaForLoan = regulationConfirmationNeeded ? false : isRegulatedArea;

  const profile = await userProfileService.getProfile();
  const profileComplete = profile.housingOwnershipTier !== null;

  let ltvPercent = null;
  let maxLoanAmount = null;
  let profileMessage = null;
  let isMortgageInRegulatedArea = false;
  let effectiveSalePrice = null;
  let salePriceSource = null;
  let referenceTransactionDate = null;

  if (!profileComplete) {
    profileMessage = '내 정보 입력 필요';
  } else {
    ({ effectiveSalePrice, salePriceSource, referenceTransactionDate } = await resolveEffectiveSalePrice(complexId, salePrice));

    if (effectiveSalePrice === null) {
      profileMessage = '매매가 입력 필요';
    } else {
      const loanLimit = loanLimitService.calculateMaxLoanAmount({
        salePrice: effectiveSalePrice,
        housingOwnershipTier: profile.housingOwnershipTier,
        isFirstTimeBuyer: profile.isFirstTimeBuyer,
        isRegulatedArea: effectiveIsRegulatedAreaForLoan,
        annualIncome: profile.annualIncome,
        annualBonus: profile.annualBonus
      });
      ltvPercent = loanLimit.ltvPercent;
      maxLoanAmount = loanLimit.maxLoanAmount;
      isMortgageInRegulatedArea = effectiveIsRegulatedAreaForLoan && maxLoanAmount > 0;
    }
  }

  return {
    complexId,
    isRegulatedArea,
    isLandTransactionPermissionZone,
    regulationConfirmationNeeded,
    ltvPercent,
    maxLoanAmount,
    profileMessage,
    effectiveSalePrice,
    salePriceSource,
    referenceTransactionDate,
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

async function getLoanSimulation(complexId, { salePrice } = {}) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  const profile = await userProfileService.getProfile();
  if (profile.housingOwnershipTier === null) {
    return {
      complexId,
      profileIncomplete: true,
      scenarios: null,
      recommendedScenario: null,
      policyMortgageNotice: POLICY_MORTGAGE_NOTICE,
      effectiveSalePrice: null,
      salePriceSource: null,
      referenceTransactionDate: null
    };
  }

  const resolved = await resolveEffectiveSalePrice(complexId, salePrice);

  if (resolved.effectiveSalePrice === null) {
    return {
      complexId,
      profileIncomplete: false,
      scenarios: null,
      recommendedScenario: null,
      policyMortgageNotice: POLICY_MORTGAGE_NOTICE,
      salePriceRequired: true,
      effectiveSalePrice: null,
      salePriceSource: null,
      referenceTransactionDate: null
    };
  }

  const regulationConfirmationNeeded = complexRow.is_land_transaction_permission_zone === null;
  const effectiveIsRegulatedAreaForLoan = regulationConfirmationNeeded ? false : complexRow.is_regulated_area;

  const scenarios = loanScenarioService.buildScenarios({
    salePrice: resolved.effectiveSalePrice,
    isRegulatedArea: effectiveIsRegulatedAreaForLoan,
    annualIncome: profile.annualIncome,
    annualBonus: profile.annualBonus,
    availableCapital: profile.availableCapital,
    isLandTransactionPermissionZone: complexRow.is_land_transaction_permission_zone
  });
  const recommendedScenario = loanScenarioService.selectRecommendedScenario(scenarios);

  return {
    complexId,
    profileIncomplete: false,
    scenarios,
    recommendedScenario,
    policyMortgageNotice: POLICY_MORTGAGE_NOTICE,
    effectiveSalePrice: resolved.effectiveSalePrice,
    salePriceSource: resolved.salePriceSource,
    referenceTransactionDate: resolved.referenceTransactionDate
  };
}

module.exports = {
  getPriceHistory,
  getJeonseHistory,
  getAssignedSchools,
  getRemodeling,
  getRegulation,
  getLoanSimulation
};
