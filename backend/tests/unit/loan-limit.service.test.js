const {
  calculateLtvCapAmount,
  calculateDsrCapAmount,
  calculateMaxLoanAmount,
} = require('../../src/services/loan-limit.service');
const { calculatePrincipalFromAnnualPayment } = require('../../src/services/repayment.service');

describe('calculateLtvCapAmount', () => {
  test.each([
    ['1주택', false, true, 88000, 40, 35200],
    ['1주택', false, false, 88000, 70, 61600],
    ['무주택', true, true, 88000, 70, 61600],
    ['무주택', true, false, 88000, 80, 70400],
    ['다주택', false, true, 88000, 0, 0],
  ])(
    'tier=%s, isFirstTimeBuyer=%s, isRegulatedArea=%s, salePrice=%i -> ltvPercent=%i, ltvCapAmount=%i',
    (housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea, salePrice, expectedLtvPercent, expectedCapAmount) => {
      const result = calculateLtvCapAmount({
        salePrice,
        housingOwnershipTier,
        isFirstTimeBuyer,
        isRegulatedArea,
      });

      expect(result.ltvPercent).toBe(expectedLtvPercent);
      expect(result.ltvCapAmount).toBe(expectedCapAmount);
      expect(result.ltvCapAmount).toBe(Math.floor((salePrice * expectedLtvPercent) / 100));
    }
  );
});

describe('calculateDsrCapAmount', () => {
  it('연소득+보너스의 40%를 연 원리금 상환액으로 보고, 금리 4.5%/30년 기준으로 역산한 원금과 일치한다', () => {
    const annualIncome = 7000;
    const annualBonus = 1000;

    const result = calculateDsrCapAmount({ annualIncome, annualBonus });

    const expected = calculatePrincipalFromAnnualPayment({
      annualPayment: (annualIncome + annualBonus) * 0.4,
      annualInterestRate: 0.045,
      years: 30,
    });

    expect(result).toBeCloseTo(expected, 8);
  });

  it('소득이 낮을수록 dsrCapAmount도 작다', () => {
    const low = calculateDsrCapAmount({ annualIncome: 3000, annualBonus: 0 });
    const high = calculateDsrCapAmount({ annualIncome: 7000, annualBonus: 1000 });

    expect(low).toBeLessThan(high);
  });
});

describe('calculateMaxLoanAmount', () => {
  it('LTV가 최소값일 때: 낮은 salePrice + 높은 소득 + 비규제지역 -> maxLoanAmount === ltvCapAmount', () => {
    const params = {
      salePrice: 70000,
      housingOwnershipTier: '1주택',
      isFirstTimeBuyer: false,
      isRegulatedArea: false,
      annualIncome: 50000,
      annualBonus: 10000,
    };

    const result = calculateMaxLoanAmount(params);

    expect(result.regionalCapAmount).toBeNull();
    expect(result.maxLoanAmount).toBe(result.ltvCapAmount);
    expect(result.maxLoanAmount).toBeLessThan(result.dsrCapAmount);
  });

  it('DSR이 최소값일 때: 높은 salePrice + 낮은 소득 + 비규제지역 -> maxLoanAmount === Math.floor(dsrCapAmount) < ltvCapAmount', () => {
    const params = {
      salePrice: 150000,
      housingOwnershipTier: '1주택',
      isFirstTimeBuyer: false,
      isRegulatedArea: false,
      annualIncome: 3000,
      annualBonus: 0,
    };

    const result = calculateMaxLoanAmount(params);

    expect(result.regionalCapAmount).toBeNull();
    expect(result.maxLoanAmount).toBe(Math.floor(result.dsrCapAmount));
    expect(result.maxLoanAmount).toBeLessThan(result.ltvCapAmount);
  });

  it('지역 대출 한도가 최소값일 때: 규제지역 + 높은 salePrice + 매우 높은 소득 -> maxLoanAmount === 60000', () => {
    const params = {
      salePrice: 200000,
      housingOwnershipTier: '1주택',
      isFirstTimeBuyer: false,
      isRegulatedArea: true,
      annualIncome: 100000,
      annualBonus: 50000,
    };

    const result = calculateMaxLoanAmount(params);

    expect(result.regionalCapAmount).toBe(60000);
    expect(result.ltvCapAmount).toBeGreaterThan(60000);
    expect(result.dsrCapAmount).toBeGreaterThan(60000);
    expect(result.maxLoanAmount).toBe(60000);
  });

  it('다주택 + 규제지역 -> ltvPercent 0, maxLoanAmount 0', () => {
    const result = calculateMaxLoanAmount({
      salePrice: 150000,
      housingOwnershipTier: '다주택',
      isFirstTimeBuyer: false,
      isRegulatedArea: true,
      annualIncome: 100000,
      annualBonus: 50000,
    });

    expect(result.ltvPercent).toBe(0);
    expect(result.ltvCapAmount).toBe(0);
    expect(result.maxLoanAmount).toBe(0);
  });
});
