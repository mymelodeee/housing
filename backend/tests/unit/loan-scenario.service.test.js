const {
  buildScenarios,
  selectRecommendedScenario,
} = require('../../src/services/loan-scenario.service');
const { determineOccupancyRequirementMonths } = require('../../src/services/regulation.service');

describe('buildScenarios', () => {
  it('단독/부부합산 모두 LTV는 1주택 tier로 고정 계산되어 규제지역이면 40, 비규제지역이면 70이 적용된다', () => {
    const regulated = buildScenarios({
      salePrice: 88000,
      isRegulatedArea: true,
      annualIncome: 7000,
      annualBonus: 1000,
      availableCapital: 20000,
      isLandTransactionPermissionZone: true,
    });
    const nonRegulated = buildScenarios({
      salePrice: 88000,
      isRegulatedArea: false,
      annualIncome: 7000,
      annualBonus: 1000,
      availableCapital: 20000,
      isLandTransactionPermissionZone: false,
    });

    regulated.forEach((s) => expect(s.ltvPercent).toBe(40));
    nonRegulated.forEach((s) => expect(s.ltvPercent).toBe(70));
  });

  it('중간 소득 + 큰 매매가 + 비규제지역 조합에서는 단독은 DSR이 병목이 되고 부부합산은 소득이 2배가 되어 LTV가 병목이 되므로 부부합산의 maxLoanAmount가 단독보다 크거나 같다', () => {
    // salePrice=50000, 비규제 LTV 60% -> ltvCap 30000.
    // 단독 소득 3000/보너스 0 -> DSR cap이 ltvCap보다 작아 DSR이 병목.
    // 부부합산은 소득이 2배(6000)가 되어 DSR cap이 커져 LTV(30000)가 병목이 된다.
    const [solo, couple] = buildScenarios({
      salePrice: 50000,
      isRegulatedArea: false,
      annualIncome: 3000,
      annualBonus: 0,
      availableCapital: 0,
      isLandTransactionPermissionZone: false,
    });

    expect(couple.maxLoanAmount).toBeGreaterThanOrEqual(solo.maxLoanAmount);
    // 위 파라미터 선택 의도대로 실제로 병목이 갈리는지(진짜 발산 케이스인지) 함께 확인한다.
    expect(couple.maxLoanAmount).toBeGreaterThan(solo.maxLoanAmount);
  });

  describe('requiredCapital / capitalSufficient 경계값', () => {
    const baseParams = {
      salePrice: 50000,
      isRegulatedArea: false,
      annualIncome: 3000,
      annualBonus: 0,
      isLandTransactionPermissionZone: false,
    };

    // maxLoanAmount는 availableCapital에 의존하지 않으므로, 우선 availableCapital=0으로
    // 단독 시나리오의 maxLoanAmount를 구한 뒤, requiredCapital이 정확히 0/1이 되도록
    // availableCapital을 역산하여 실제 함수를 재호출한다.
    const [probeSolo] = buildScenarios({ ...baseParams, availableCapital: 0 });
    const maxLoanAmount = probeSolo.maxLoanAmount;

    test.each([
      [0, true],
      [1, false],
    ])('requiredCapital=%i -> capitalSufficient=%p', (requiredCapital, expectedSufficient) => {
      const availableCapital = baseParams.salePrice - maxLoanAmount - requiredCapital;

      const [solo] = buildScenarios({ ...baseParams, availableCapital });

      expect(solo.requiredCapital).toBe(requiredCapital);
      expect(solo.capitalSufficient).toBe(expectedSufficient);
    });
  });

  describe('occupancyRequirementMonths', () => {
    test.each([
      ['규제지역 + 토허구역 확정 true', true, true],
      ['규제지역 + 토허구역 확정 false', true, false],
      ['규제지역 + 토허구역 미확정 null', true, null],
      ['비규제지역 + 토허구역 확정 true', false, true],
      ['비규제지역 + 토허구역 확정 false', false, false],
      ['비규제지역 + 토허구역 미확정 null', false, null],
    ])('%s', (_label, isRegulatedArea, isLandTransactionPermissionZone) => {
      const [solo, couple] = buildScenarios({
        salePrice: 88000,
        isRegulatedArea,
        annualIncome: 7000,
        annualBonus: 1000,
        availableCapital: 20000,
        isLandTransactionPermissionZone,
      });

      [solo, couple].forEach((scenario) => {
        const isMortgageInRegulatedArea = isRegulatedArea && scenario.maxLoanAmount > 0;
        const expected = determineOccupancyRequirementMonths({
          isLandTransactionPermissionZone,
          isMortgageInRegulatedArea,
        });

        expect(scenario.occupancyRequirementMonths).toBe(expected);
      });
    });
  });
});

describe('buildScenarios - 이율/체증식 상환 필드', () => {
  it('각 시나리오는 interestRatePercent 4.5와 interestRateSource, graduatedRepayment10y/20y/30y를 포함한다', () => {
    const [solo] = buildScenarios({
      salePrice: 88000,
      isRegulatedArea: false,
      annualIncome: 7000,
      annualBonus: 1000,
      availableCapital: 20000,
      isLandTransactionPermissionZone: false,
    });

    expect(solo.interestRatePercent).toBe(4.5);
    expect(typeof solo.interestRateSource).toBe('string');
    expect(solo.interestRateSource.length).toBeGreaterThan(0);

    [solo.graduatedRepayment10y, solo.graduatedRepayment20y, solo.graduatedRepayment30y].forEach((g) => {
      expect(typeof g.initialMonthlyPayment).toBe('number');
      expect(typeof g.finalMonthlyPayment).toBe('number');
      expect(g.finalMonthlyPayment).toBeGreaterThan(g.initialMonthlyPayment);
    });
  });

  it('기존 monthlyRepayment10y/20y/30y(원리금균등)는 그대로 유지된다', () => {
    const [solo] = buildScenarios({
      salePrice: 88000,
      isRegulatedArea: false,
      annualIncome: 7000,
      annualBonus: 1000,
      availableCapital: 20000,
      isLandTransactionPermissionZone: false,
    });

    expect(typeof solo.monthlyRepayment10y).toBe('number');
    expect(typeof solo.monthlyRepayment20y).toBe('number');
    expect(typeof solo.monthlyRepayment30y).toBe('number');
  });
});

describe('selectRecommendedScenario', () => {
  it('(a) capitalSufficient:false인 시나리오는 maxLoanAmount가 더 커도 배제되고, 나머지(capitalSufficient:true) 시나리오가 선택된다', () => {
    const scenarios = [
      {
        ownershipStructure: '단독',
        maxLoanAmount: 50000,
        capitalSufficient: false,
        dsrUsageRate: 0.5,
      },
      {
        ownershipStructure: '부부합산',
        maxLoanAmount: 30000,
        capitalSufficient: true,
        dsrUsageRate: 0.8,
      },
    ];

    expect(selectRecommendedScenario(scenarios)).toBe('부부합산');
  });

  it('(b) 둘 다 capitalSufficient:true이고 maxLoanAmount가 다르면 dsrUsageRate와 무관하게 maxLoanAmount가 큰 쪽이 선택된다', () => {
    const scenarios = [
      {
        ownershipStructure: '단독',
        maxLoanAmount: 30000,
        capitalSufficient: true,
        dsrUsageRate: 0.1,
      },
      {
        ownershipStructure: '부부합산',
        maxLoanAmount: 40000,
        capitalSufficient: true,
        dsrUsageRate: 0.9,
      },
    ];

    expect(selectRecommendedScenario(scenarios)).toBe('부부합산');
  });

  it('(c) maxLoanAmount가 같으면 dsrUsageRate가 더 낮은 쪽이 선택된다', () => {
    const scenarios = [
      {
        ownershipStructure: '단독',
        maxLoanAmount: 30000,
        capitalSufficient: true,
        dsrUsageRate: 0.6,
      },
      {
        ownershipStructure: '부부합산',
        maxLoanAmount: 30000,
        capitalSufficient: true,
        dsrUsageRate: 0.4,
      },
    ];

    expect(selectRecommendedScenario(scenarios)).toBe('부부합산');
  });

  it('(d) maxLoanAmount와 dsrUsageRate가 모두 동일하면 부부합산이 선택된다', () => {
    const scenarios = [
      {
        ownershipStructure: '단독',
        maxLoanAmount: 30000,
        capitalSufficient: true,
        dsrUsageRate: 0.5,
      },
      {
        ownershipStructure: '부부합산',
        maxLoanAmount: 30000,
        capitalSufficient: true,
        dsrUsageRate: 0.5,
      },
    ];

    expect(selectRecommendedScenario(scenarios)).toBe('부부합산');
  });

  it('두 시나리오 모두 capitalSufficient:false이면 null을 반환한다', () => {
    const scenarios = [
      {
        ownershipStructure: '단독',
        maxLoanAmount: 30000,
        capitalSufficient: false,
        dsrUsageRate: 0.5,
      },
      {
        ownershipStructure: '부부합산',
        maxLoanAmount: 40000,
        capitalSufficient: false,
        dsrUsageRate: 0.3,
      },
    ];

    expect(selectRecommendedScenario(scenarios)).toBeNull();
  });
});
