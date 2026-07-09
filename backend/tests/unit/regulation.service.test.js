const {
  getLtvPercent,
  mapLandTransactionZoneStatus,
  getRegionalLoanCapAmount,
  determineGapInvestmentAllowed,
  determineOccupancyRequirementMonths,
  evaluateRegulation,
} = require('../../src/services/regulation.service');

describe('getLtvPercent', () => {
  test.each([
    ['무주택', true, true, 70],
    ['무주택', true, false, 80],
    ['무주택', false, true, 60],
    ['무주택', false, false, 70],
    ['1주택', true, true, 50],
    ['1주택', true, false, 60],
    ['다주택', true, true, 0],
    ['다주택', true, false, 60],
  ])(
    '%s, isFirstTimeBuyer=%s, isRegulatedArea=%s -> %i',
    (housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea, expected) => {
      expect(
        getLtvPercent({ housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea })
      ).toBe(expected);
    }
  );
});

describe('mapLandTransactionZoneStatus', () => {
  test.each([
    [null, '확인필요'],
    [true, true],
    [false, false],
  ])('%p -> %p', (value, expected) => {
    expect(mapLandTransactionZoneStatus(value)).toBe(expected);
  });
});

describe('getRegionalLoanCapAmount', () => {
  test.each([
    [true, 60000],
    [false, null],
  ])('isRegulatedArea=%p -> %p', (isRegulatedArea, expected) => {
    expect(getRegionalLoanCapAmount(isRegulatedArea)).toBe(expected);
  });
});

describe('determineGapInvestmentAllowed', () => {
  test.each([
    [true, false, false],
    [true, true, false],
    [false, true, false],
    [false, false, true],
    [null, false, true],
  ])(
    'isLandTransactionPermissionZone=%p, isMortgageInRegulatedArea=%p -> %p',
    (isLandTransactionPermissionZone, isMortgageInRegulatedArea, expected) => {
      expect(
        determineGapInvestmentAllowed({
          isLandTransactionPermissionZone,
          isMortgageInRegulatedArea,
        })
      ).toBe(expected);
    }
  );
});

describe('determineOccupancyRequirementMonths', () => {
  test.each([
    [true, false, 24],
    [true, true, 24],
    [false, true, 6],
    [false, false, null],
    [null, true, 6],
  ])(
    'isLandTransactionPermissionZone=%p, isMortgageInRegulatedArea=%p -> %p',
    (isLandTransactionPermissionZone, isMortgageInRegulatedArea, expected) => {
      expect(
        determineOccupancyRequirementMonths({
          isLandTransactionPermissionZone,
          isMortgageInRegulatedArea,
        })
      ).toBe(expected);
    }
  );
});

describe('evaluateRegulation', () => {
  test('1주택, 비규제지역, 토허구역 null, 대출규제지역 아님', () => {
    const result = evaluateRegulation({
      housingOwnershipTier: '1주택',
      isFirstTimeBuyer: true,
      isRegulatedArea: false,
      isLandTransactionPermissionZone: null,
      isMortgageInRegulatedArea: false,
    });

    expect(result).toEqual({
      ltvPercent: 60,
      isLandTransactionPermissionZone: '확인필요',
      regionalLoanCapAmount: null,
      gapInvestmentAllowed: true,
      occupancyRequirementMonths: null,
    });
  });
});
