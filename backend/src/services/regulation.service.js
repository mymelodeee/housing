// 2025.9.7/6.28 가계부채 관리 대책 기준(2026.6.30 대책으로 화성 동탄구·용인 기흥구 등 규제지역 추가
// 지정, LTV 수치 자체는 변경 없음). 1주택은 2025.6.28 대책 이후 원칙적으로 신규 주담대가 금지되고
// 기존 주택 6개월 내 처분 조건부일 때만 대출이 실행되므로, 처분조건부를 전제로 무주택-미해당과
// 동일 기준을 적용한다(도메인 §5.1.3).
const LTV_TABLE = {
  '무주택-생애최초': { regulated: 70, nonRegulated: 80 },
  '무주택-미해당': { regulated: 40, nonRegulated: 70 },
  '1주택': { regulated: 40, nonRegulated: 70 },
  '다주택': { regulated: 0, nonRegulated: 60 }
};

function resolveOwnershipKey(housingOwnershipTier, isFirstTimeBuyer) {
  if (housingOwnershipTier === '무주택') {
    return isFirstTimeBuyer ? '무주택-생애최초' : '무주택-미해당';
  }
  return housingOwnershipTier;
}

function getLtvPercent({ housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea }) {
  const key = resolveOwnershipKey(housingOwnershipTier, isFirstTimeBuyer);
  const row = LTV_TABLE[key];
  return isRegulatedArea ? row.regulated : row.nonRegulated;
}

function mapLandTransactionZoneStatus(isLandTransactionPermissionZone) {
  return isLandTransactionPermissionZone === null ? '확인필요' : isLandTransactionPermissionZone;
}

function getRegionalLoanCapAmount(isRegulatedArea) {
  return isRegulatedArea ? 60000 : null;
}

function determineGapInvestmentAllowed({ isLandTransactionPermissionZone, isMortgageInRegulatedArea }) {
  const isInZone = isLandTransactionPermissionZone === true;
  return !isInZone && !isMortgageInRegulatedArea;
}

function determineOccupancyRequirementMonths({ isLandTransactionPermissionZone, isMortgageInRegulatedArea }) {
  if (isLandTransactionPermissionZone === true) return 24;
  if (isMortgageInRegulatedArea) return 6;
  return null;
}

function evaluateRegulation({
  housingOwnershipTier,
  isFirstTimeBuyer,
  isRegulatedArea,
  isLandTransactionPermissionZone,
  isMortgageInRegulatedArea
}) {
  return {
    ltvPercent: getLtvPercent({ housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea }),
    isLandTransactionPermissionZone: mapLandTransactionZoneStatus(isLandTransactionPermissionZone),
    regionalLoanCapAmount: getRegionalLoanCapAmount(isRegulatedArea),
    gapInvestmentAllowed: determineGapInvestmentAllowed({ isLandTransactionPermissionZone, isMortgageInRegulatedArea }),
    occupancyRequirementMonths: determineOccupancyRequirementMonths({ isLandTransactionPermissionZone, isMortgageInRegulatedArea })
  };
}

module.exports = {
  getLtvPercent,
  mapLandTransactionZoneStatus,
  getRegionalLoanCapAmount,
  determineGapInvestmentAllowed,
  determineOccupancyRequirementMonths,
  evaluateRegulation
};
