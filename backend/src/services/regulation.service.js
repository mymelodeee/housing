const LTV_TABLE = {
  '무주택-생애최초': { regulated: 70, nonRegulated: 80 },
  '무주택-미해당': { regulated: 60, nonRegulated: 70 },
  '1주택': { regulated: 50, nonRegulated: 60 },
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
