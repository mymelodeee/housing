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
const developmentProjectsService = require('./development-projects.service');
const academyService = require('./academy.service');
const acquisitionTaxService = require('./acquisition-tax.service');
const brokerageFeeService = require('./brokerage-fee.service');
const stampDutyService = require('./stamp-duty.service');
const repaymentService = require('./repayment.service');
const holdingTaxService = require('./holding-tax.service');
const marketInterestRateService = require('./market-interest-rate.service');

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

function filterByExclusiveArea(entries, exclusiveArea) {
  if (typeof exclusiveArea !== 'number' || Number.isNaN(exclusiveArea)) return entries;
  return entries.filter((entry) => entry.exclusiveArea === exclusiveArea);
}

function collectAvailableExclusiveAreas(entryLists) {
  const areas = new Set();
  for (const entries of entryLists) {
    for (const entry of entries) {
      if (typeof entry.exclusiveArea === 'number') areas.add(entry.exclusiveArea);
    }
  }
  return [...areas].sort((a, b) => a - b);
}

async function getJeonseHistory(complexId, { exclusiveArea } = {}) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  if (!complexRow.lawd_cd || !complexRow.molit_apt_name) {
    return {
      complexId,
      saleEntries: [],
      jeonseEntries: [],
      ratioEntries: [],
      availableExclusiveAreas: [],
      lookupWindowNote: LOOKUP_WINDOW_NOTE
    };
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

  // 평형을 지정하면 매매/전세 목록과 전세가율을 모두 해당 평형 기준으로 재계산한다
  // (평형별 매매가와 전체 평형 기준 전세가율이 뒤섞여 표시되는 것을 방지).
  const filteredSaleEntries = filterByExclusiveArea(saleResult.entries, exclusiveArea);
  const filteredJeonseEntries = filterByExclusiveArea(jeonseEntries, exclusiveArea);

  return {
    complexId,
    saleEntries: filteredSaleEntries,
    jeonseEntries: filteredJeonseEntries,
    ratioEntries: jeonseHistoryService.buildJeonseRatioEntries({
      saleEntries: filteredSaleEntries,
      jeonseEntries: filteredJeonseEntries
    }),
    availableExclusiveAreas: collectAvailableExclusiveAreas([saleResult.entries, jeonseEntries]),
    lookupWindowNote: LOOKUP_WINDOW_NOTE
  };
}

async function getAssignedSchools(complexId) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  if (complexRow.latitude === null || complexRow.longitude === null) {
    return {
      complexId,
      elementarySchool: null,
      middleSchool: null,
      highSchool: null,
      academyCount: null,
      assignmentNote: ASSIGNMENT_NOTE
    };
  }

  const [elementarySchool, middleSchool, highSchool, academyCount] = await Promise.all([
    elementarySchoolService.findNearestSchoolByLevel(complexRow.latitude, complexRow.longitude, '초등학교'),
    elementarySchoolService.findNearestSchoolByLevel(complexRow.latitude, complexRow.longitude, '중학교'),
    elementarySchoolService.findNearestSchoolByLevel(complexRow.latitude, complexRow.longitude, '고등학교'),
    academyService.countAcademiesWithin1km(complexRow.latitude, complexRow.longitude).catch(() => null)
  ]);

  return { complexId, elementarySchool, middleSchool, highSchool, academyCount, assignmentNote: ASSIGNMENT_NOTE };
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

async function getDevelopmentProjects(complexId) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  return developmentProjectsService.getDevelopmentProjects(complexId, complexRow.lawd_cd);
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
      const interestRate = await marketInterestRateService.getCurrentRate();
      const loanLimit = loanLimitService.calculateMaxLoanAmount({
        salePrice: effectiveSalePrice,
        housingOwnershipTier: profile.housingOwnershipTier,
        isFirstTimeBuyer: profile.isFirstTimeBuyer,
        isRegulatedArea: effectiveIsRegulatedAreaForLoan,
        annualIncome: profile.annualIncome,
        annualBonus: profile.annualBonus,
        annualInterestRate: interestRate.ratePercent / 100
      });
      ltvPercent = loanLimit.ltvPercent;
      maxLoanAmount = loanLimit.maxLoanAmount;
      isMortgageInRegulatedArea = effectiveIsRegulatedAreaForLoan && maxLoanAmount > 0;
    }
  }

  return {
    complexId,
    isRegulatedArea,
    isAdjustmentTargetArea: complexRow.is_adjustment_target_area,
    isSpeculativeOverheatedArea: complexRow.is_speculative_overheated_area,
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

  const interestRate = await marketInterestRateService.getCurrentRate();

  const scenarios = loanScenarioService.buildScenarios({
    salePrice: resolved.effectiveSalePrice,
    isRegulatedArea: effectiveIsRegulatedAreaForLoan,
    annualIncome: profile.annualIncome,
    annualBonus: profile.annualBonus,
    availableCapital: profile.availableCapital,
    isLandTransactionPermissionZone: complexRow.is_land_transaction_permission_zone,
    annualInterestRate: interestRate.ratePercent / 100,
    interestRateSource: interestRate.sourceLabel
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
    referenceTransactionDate: resolved.referenceTransactionDate,
    interestRateMeta: {
      ratePercent: interestRate.ratePercent,
      referencePeriod: interestRate.referencePeriod,
      checkedAt: interestRate.checkedAt,
      daysSinceChecked: interestRate.daysSinceChecked,
      isStale: interestRate.isStale
    }
  };
}

// 세대 주택 보유 구분(무주택/1주택/다주택)만으로는 취득세 계산에 필요한 정확한 취득 후
// 주택 수를 알 수 없어(다주택이 2채인지 3채 이상인지 구분 불가), 안전한 하한값을 기본값으로
// 쓰고 query parameter(homeCount)로 사용자가 직접 조정할 수 있게 한다.
const DEFAULT_HOME_COUNT_AFTER_PURCHASE = { 무주택: 1, '1주택': 2, 다주택: 3 };
const DEFAULT_EXCLUSIVE_AREA = 85;

function resolveDefaultHomeCountAfterPurchase(housingOwnershipTier) {
  return DEFAULT_HOME_COUNT_AFTER_PURCHASE[housingOwnershipTier] || 1;
}

async function getAcquisitionCosts(complexId, { salePrice, exclusiveArea, homeCount, isHeavyTaxExempt, negotiatedRatePercent, buyerStampDutySharePercent } = {}) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  const { effectiveSalePrice, salePriceSource, referenceTransactionDate } = await resolveEffectiveSalePrice(complexId, salePrice);

  if (effectiveSalePrice === null) {
    return {
      complexId,
      effectiveSalePrice: null,
      salePriceSource: null,
      referenceTransactionDate: null,
      message: '매매가 입력 필요'
    };
  }

  const profile = await userProfileService.getProfile();
  const effectiveHomeCount = typeof homeCount === 'number' ? homeCount : resolveDefaultHomeCountAfterPurchase(profile.housingOwnershipTier);
  const effectiveExclusiveArea = typeof exclusiveArea === 'number' ? exclusiveArea : DEFAULT_EXCLUSIVE_AREA;

  const acquisition = acquisitionTaxService.calculateAcquisitionCosts({
    salePrice: effectiveSalePrice,
    isRegulatedArea: complexRow.is_regulated_area,
    homeCountAfterPurchase: effectiveHomeCount,
    exclusiveArea: effectiveExclusiveArea,
    isHeavyTaxExempt: Boolean(isHeavyTaxExempt)
  });
  const brokerage = brokerageFeeService.calculateSaleBrokerageFee({ salePrice: effectiveSalePrice, negotiatedRatePercent });
  const stampDutyAmount = stampDutyService.calculateBuyerStampDuty({
    salePrice: effectiveSalePrice,
    buyerSharePercent: typeof buyerStampDutySharePercent === 'number' ? buyerStampDutySharePercent : 100
  });

  return {
    complexId,
    effectiveSalePrice,
    salePriceSource,
    referenceTransactionDate,
    homeCountAfterPurchase: effectiveHomeCount,
    exclusiveArea: effectiveExclusiveArea,
    acquisitionTax: {
      amount: acquisition.acquisitionTax,
      ratePercent: acquisition.acquisitionTaxRate * 100,
      isHeavyTaxRate: acquisition.isHeavyTaxRate,
      rateLabel: acquisition.rateLabel
    },
    localEducationTax: { amount: acquisition.localEducationTax, ratePercent: acquisition.localEducationTaxRate * 100 },
    ruralSpecialTax: { amount: acquisition.ruralSpecialTax, ratePercent: acquisition.ruralSpecialTaxRate * 100 },
    brokerageFee: {
      amount: brokerage.totalFee,
      appliedRatePercent: brokerage.appliedRatePercent,
      capRatePercent: brokerage.capRatePercent,
      isCapped: brokerage.isCapped,
      // 표시 금액은 VAT 미포함(법정 상한액 자체에는 부가가치세가 포함되지 않으며, 개업
      // 공인중개사가 일반과세자면 별도로 10%를 추가 청구할 수 있다 — 법제처 유권해석).
      vatIncluded: false,
      estimateType: 'ESTIMATE'
    },
    stampDuty: { amount: stampDutyAmount },
    totalCost: acquisition.totalTax + brokerage.totalFee + stampDutyAmount
  };
}

async function getLoanSchedule(complexId, { principal, interestRatePercent, graceMonths, years } = {}) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  if (typeof principal !== 'number' || typeof interestRatePercent !== 'number') {
    return { complexId, schedule: null, message: '원금과 금리 입력 필요' };
  }

  const effectiveGraceMonths = typeof graceMonths === 'number' ? graceMonths : 0;
  const effectiveYears = typeof years === 'number' ? years : 30;

  const schedule = repaymentService.calculateAmortizationSchedule({
    principal,
    annualInterestRate: interestRatePercent / 100,
    years: effectiveYears,
    graceMonths: effectiveGraceMonths
  });

  return {
    complexId,
    principal,
    interestRatePercent,
    years: effectiveYears,
    graceMonths: effectiveGraceMonths,
    ...schedule
  };
}

const DEFAULT_PUBLIC_PRICE_RATIO_PERCENT = 70;

async function getHoldingTaxEstimate(complexId, { salePrice, publicPrice, publicRatio, homeCount, includeUrbanAreaTax } = {}) {
  const complexRow = await apartmentComplexesRepository.findById(complexId);
  if (!complexRow) return null;

  const { effectiveSalePrice, salePriceSource, referenceTransactionDate } = await resolveEffectiveSalePrice(complexId, salePrice);

  const profile = await userProfileService.getProfile();
  const effectiveHomeCount = typeof homeCount === 'number' ? homeCount : resolveDefaultHomeCountAfterPurchase(profile.housingOwnershipTier);

  let effectivePublicPrice = typeof publicPrice === 'number' ? publicPrice : null;
  let publicPriceSource = effectivePublicPrice !== null ? 'user' : null;

  if (effectivePublicPrice === null) {
    if (effectiveSalePrice === null) {
      return {
        complexId,
        effectiveSalePrice: null,
        salePriceSource: null,
        referenceTransactionDate: null,
        publicPrice: null,
        publicPriceSource: null,
        message: '매매가 또는 공시가격 입력 필요'
      };
    }
    const ratio = typeof publicRatio === 'number' ? publicRatio : DEFAULT_PUBLIC_PRICE_RATIO_PERCENT;
    effectivePublicPrice = Math.round(effectiveSalePrice * (ratio / 100));
    publicPriceSource = 'estimated';
  }

  const estimate = holdingTaxService.calculateHoldingTaxEstimate({
    publicPrice: effectivePublicPrice,
    homeCount: effectiveHomeCount,
    includeUrbanAreaTax: Boolean(includeUrbanAreaTax)
  });

  return {
    complexId,
    effectiveSalePrice,
    salePriceSource,
    referenceTransactionDate,
    publicPrice: effectivePublicPrice,
    publicPriceSource,
    homeCountAfterPurchase: effectiveHomeCount,
    isOneHouse: estimate.isOneHouse,
    propertyTax: estimate.propertyTax,
    comprehensiveTax: { ...estimate.comprehensiveTax, estimateType: 'ESTIMATE' },
    totalAnnualHoldingTax: estimate.totalAnnualHoldingTax
  };
}

module.exports = {
  getPriceHistory,
  getJeonseHistory,
  getAssignedSchools,
  getRemodeling,
  getDevelopmentProjects,
  getRegulation,
  getLoanSimulation,
  getAcquisitionCosts,
  getLoanSchedule,
  getHoldingTaxEstimate
};
