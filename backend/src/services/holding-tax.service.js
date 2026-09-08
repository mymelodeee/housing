// 재산세(지방세법 제110조·제111조·제111조의2, 지방세법 시행령 제109조)와
// 종합부동산세(종합부동산세법 제8조·제9조, 2026-01-01 시행 기준 — 1세대1주택 12억원/
// 그 외 9억원 기본공제, 공정시장가액비율 60%를 국가법령정보센터로 확인) 간이추정이다.
// 재산세는 OFFICIAL_RULE 성격이나, 종합부동산세는 재산세 상당액 공제·세액공제·세부담상한 등
// 실제 신고 요소를 생략한 간이 계산이라 항상 ESTIMATE로 취급해야 한다(호출부 책임).
//
// 이 파일의 모든 내부 계산은 원(WON) 단위다. 공개 함수는 이 앱의 관례(만원)로 입력을
// 받아 즉시 원으로 환산한 뒤 계산하고, 결과 금액은 원 단위로 반환한다.
const MANWON = 10000;

function resolvePropertyFairMarketValueRatio({ publicPriceWon, isOneHouse }) {
  if (!isOneHouse) return 0.6;
  if (publicPriceWon <= 300000000) return 0.43;
  if (publicPriceWon <= 600000000) return 0.44;
  return 0.45;
}

// 1세대1주택 특례세율은 공시가격 9억원 이하일 때만 적용된다.
function calculatePropertyTaxCoreWon({ baseWon, isSpecialOneHouse }) {
  if (isSpecialOneHouse) {
    if (baseWon <= 60000000) return baseWon * 0.0005;
    if (baseWon <= 150000000) return 30000 + (baseWon - 60000000) * 0.001;
    if (baseWon <= 300000000) return 120000 + (baseWon - 150000000) * 0.002;
    return 420000 + (baseWon - 300000000) * 0.0035;
  }
  if (baseWon <= 60000000) return baseWon * 0.001;
  if (baseWon <= 150000000) return 60000 + (baseWon - 60000000) * 0.0015;
  if (baseWon <= 300000000) return 195000 + (baseWon - 150000000) * 0.0025;
  return 570000 + (baseWon - 300000000) * 0.004;
}

function calculatePropertyTax({ publicPrice, isOneHouse, includeUrbanAreaTax = false }) {
  const publicPriceWon = publicPrice * MANWON;
  const fairMarketValueRatio = resolvePropertyFairMarketValueRatio({ publicPriceWon, isOneHouse });
  const baseWon = publicPriceWon * fairMarketValueRatio;
  const isSpecialOneHouse = isOneHouse && publicPriceWon <= 900000000;
  const propertyTaxCoreWon = calculatePropertyTaxCoreWon({ baseWon, isSpecialOneHouse });
  const localEducationTaxWon = propertyTaxCoreWon * 0.2;
  const urbanAreaTaxWon = includeUrbanAreaTax ? baseWon * 0.0014 : 0;

  return {
    fairMarketValueRatio,
    isSpecialOneHouse,
    propertyTax: Math.round(propertyTaxCoreWon),
    localEducationTax: Math.round(localEducationTaxWon),
    urbanAreaTax: Math.round(urbanAreaTaxWon),
    total: Math.round(propertyTaxCoreWon + localEducationTaxWon + urbanAreaTaxWon)
  };
}

function calculateComprehensiveTaxCoreWon({ taxableBaseWon, isMultiHome }) {
  if (taxableBaseWon <= 300000000) return taxableBaseWon * 0.005;
  if (taxableBaseWon <= 600000000) return 1500000 + (taxableBaseWon - 300000000) * 0.007;
  if (taxableBaseWon <= 1200000000) return 3600000 + (taxableBaseWon - 600000000) * 0.01;
  if (!isMultiHome) {
    if (taxableBaseWon <= 2500000000) return 9600000 + (taxableBaseWon - 1200000000) * 0.013;
    if (taxableBaseWon <= 5000000000) return 26500000 + (taxableBaseWon - 2500000000) * 0.015;
    if (taxableBaseWon <= 9400000000) return 64000000 + (taxableBaseWon - 5000000000) * 0.02;
    return 152000000 + (taxableBaseWon - 9400000000) * 0.027;
  }
  if (taxableBaseWon <= 2500000000) return 9600000 + (taxableBaseWon - 1200000000) * 0.02;
  if (taxableBaseWon <= 5000000000) return 35600000 + (taxableBaseWon - 2500000000) * 0.03;
  if (taxableBaseWon <= 9400000000) return 110600000 + (taxableBaseWon - 5000000000) * 0.04;
  return 286600000 + (taxableBaseWon - 9400000000) * 0.05;
}

const COMPREHENSIVE_TAX_FMV_RATIO = 0.6;
const ONE_HOUSE_DEDUCTION_WON = 1200000000;
const GENERAL_DEDUCTION_WON = 900000000;

function calculateComprehensiveTax({ totalPublicPriceSum, isOneHouse, homeCount }) {
  const totalPublicPriceSumWon = totalPublicPriceSum * MANWON;
  const deductionWon = isOneHouse ? ONE_HOUSE_DEDUCTION_WON : GENERAL_DEDUCTION_WON;
  const taxableBaseWon = Math.max(0, totalPublicPriceSumWon - deductionWon) * COMPREHENSIVE_TAX_FMV_RATIO;

  if (taxableBaseWon <= 0) {
    return { deduction: deductionWon / MANWON, taxableBase: 0, comprehensiveTax: 0, ruralSpecialTax: 0, total: 0 };
  }

  const comprehensiveTaxCoreWon = calculateComprehensiveTaxCoreWon({ taxableBaseWon, isMultiHome: homeCount >= 3 });
  const ruralSpecialTaxWon = comprehensiveTaxCoreWon * 0.2;

  return {
    deduction: deductionWon / MANWON,
    taxableBase: Math.round(taxableBaseWon / MANWON),
    comprehensiveTax: Math.round(comprehensiveTaxCoreWon),
    ruralSpecialTax: Math.round(ruralSpecialTaxWon),
    total: Math.round(comprehensiveTaxCoreWon + ruralSpecialTaxWon)
  };
}

// 이 서비스는 단일 단지 평가 도구이므로, 종합부동산세 계산의 "공시가격 합계"는
// 이 단지의 공시가격만 사용하는 단순화를 적용한다(다주택 포트폴리오 합산 미지원).
function calculateHoldingTaxEstimate({ publicPrice, homeCount, includeUrbanAreaTax = false }) {
  const isOneHouse = homeCount === 1;
  const propertyTax = calculatePropertyTax({ publicPrice, isOneHouse, includeUrbanAreaTax });
  const comprehensiveTax = calculateComprehensiveTax({ totalPublicPriceSum: publicPrice, isOneHouse, homeCount });

  return {
    publicPrice,
    isOneHouse,
    propertyTax,
    comprehensiveTax,
    totalAnnualHoldingTax: propertyTax.total + comprehensiveTax.total
  };
}

module.exports = {
  resolvePropertyFairMarketValueRatio,
  calculatePropertyTaxCoreWon,
  calculatePropertyTax,
  calculateComprehensiveTaxCoreWon,
  calculateComprehensiveTax,
  calculateHoldingTaxEstimate
};
