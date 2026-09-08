// 지방세법 제11조(취득세 표준세율)·제13조의2(다주택자 중과)·제151조(농어촌특별세),
// 지방세법 시행령 제109조(지방교육세)를 근거로 한 주택 유상취득 취득세 계산이다.
// 2026-09 시점 확인 값: 6억원 이하 1%, 6억 초과~9억원 이하 구간별 산식, 9억원 초과 3%.
// 다주택 중과: 규제지역 2주택/비규제지역 3주택부터 8%, 규제지역 3주택 이상/비규제지역 4주택 이상 12%.
const MANWON = 10000;

function calculateBaseAcquisitionTaxRate(salePrice) {
  if (salePrice <= 60000) return 0.01;
  if (salePrice <= 90000) {
    const percent = (salePrice * 2) / 30000 - 3;
    return Math.round(percent * 10000) / 10000 / 100;
  }
  return 0.03;
}

function resolveAcquisitionTaxRate({ salePrice, isRegulatedArea, homeCountAfterPurchase, isHeavyTaxExempt }) {
  if (isHeavyTaxExempt) {
    return { rate: calculateBaseAcquisitionTaxRate(salePrice), isHeavy: false, label: '다주택 중과 예외 적용 → 기본세율' };
  }
  if ((isRegulatedArea && homeCountAfterPurchase >= 3) || (!isRegulatedArea && homeCountAfterPurchase >= 4)) {
    return { rate: 0.12, isHeavy: true, label: '다주택 중과 12%' };
  }
  if ((isRegulatedArea && homeCountAfterPurchase >= 2) || (!isRegulatedArea && homeCountAfterPurchase >= 3)) {
    return { rate: 0.08, isHeavy: true, label: '다주택 중과 8%' };
  }
  return { rate: calculateBaseAcquisitionTaxRate(salePrice), isHeavy: false, label: '주택 유상취득 기본세율' };
}

function calculateLocalEducationTaxRate({ rate, isHeavy }) {
  return isHeavy ? 0.004 : rate * 0.1;
}

// 농어촌특별세는 전용면적 85㎡ 초과 주택에만 부과된다.
function calculateRuralSpecialTaxRate({ rate, isHeavy, exclusiveArea }) {
  if (exclusiveArea <= 85) return 0;
  if (isHeavy && Math.abs(rate - 0.12) < 1e-9) return 0.01;
  if (isHeavy && Math.abs(rate - 0.08) < 1e-9) return 0.006;
  return 0.002;
}

function calculateAcquisitionCosts({ salePrice, isRegulatedArea, homeCountAfterPurchase, exclusiveArea, isHeavyTaxExempt }) {
  const { rate, isHeavy, label } = resolveAcquisitionTaxRate({
    salePrice,
    isRegulatedArea,
    homeCountAfterPurchase,
    isHeavyTaxExempt
  });
  const localEducationTaxRate = calculateLocalEducationTaxRate({ rate, isHeavy });
  const ruralSpecialTaxRate = calculateRuralSpecialTaxRate({ rate, isHeavy, exclusiveArea });

  const acquisitionTax = Math.round(salePrice * MANWON * rate);
  const localEducationTax = Math.round(salePrice * MANWON * localEducationTaxRate);
  const ruralSpecialTax = Math.round(salePrice * MANWON * ruralSpecialTaxRate);

  return {
    acquisitionTaxRate: rate,
    isHeavyTaxRate: isHeavy,
    rateLabel: label,
    acquisitionTax,
    localEducationTaxRate,
    localEducationTax,
    ruralSpecialTaxRate,
    ruralSpecialTax,
    totalTax: acquisitionTax + localEducationTax + ruralSpecialTax
  };
}

module.exports = {
  calculateBaseAcquisitionTaxRate,
  resolveAcquisitionTaxRate,
  calculateLocalEducationTaxRate,
  calculateRuralSpecialTaxRate,
  calculateAcquisitionCosts
};
