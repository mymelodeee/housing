const {
  calculateMonthlyPayment,
  calculateRepaymentSchedule,
  calculatePrincipalFromAnnualPayment,
  calculateGraduatedRepaymentSchedule,
} = require('../../src/services/repayment.service');

describe('calculateMonthlyPayment', () => {
  it('원리금균등상환 월 상환액을 계산한다', () => {
    const result = calculateMonthlyPayment({
      principal: 30000,
      annualInterestRate: 0.04,
      years: 10,
    });

    expect(result).toBeCloseTo(303.73541449463875, 2);
  });

  it('principal이 0이면 0을 반환한다', () => {
    expect(
      calculateMonthlyPayment({ principal: 0, annualInterestRate: 0.04, years: 10 })
    ).toBe(0);
    expect(
      calculateMonthlyPayment({ principal: 0, annualInterestRate: 0, years: 30 })
    ).toBe(0);
  });

  it('annualInterestRate가 0이면 principal/n과 정확히 일치한다', () => {
    const result = calculateMonthlyPayment({
      principal: 12000,
      annualInterestRate: 0,
      years: 10,
    });

    expect(result).toBe(100);
  });
});

describe('calculateRepaymentSchedule', () => {
  const schedule = calculateRepaymentSchedule({
    principal: 30000,
    annualInterestRate: 0.04,
  });

  it('10, 20, 30년 스케줄을 순서대로 반환한다', () => {
    expect(schedule).toHaveLength(3);
    expect(schedule.map((item) => item.years)).toEqual([10, 20, 30]);
  });

  it('각 항목의 annualPayment는 monthlyPayment * 12와 일치한다', () => {
    schedule.forEach((item) => {
      expect(item.annualPayment).toBeCloseTo(item.monthlyPayment * 12, 8);
    });
  });

  it('기간이 길수록 monthlyPayment는 작아진다', () => {
    expect(schedule[0].monthlyPayment).toBeGreaterThan(schedule[1].monthlyPayment);
    expect(schedule[1].monthlyPayment).toBeGreaterThan(schedule[2].monthlyPayment);
  });
});

describe('calculatePrincipalFromAnnualPayment', () => {
  it('monthlyPayment*12를 입력하면 원래 principal을 근사 복원한다', () => {
    const principal = 50000;
    const annualInterestRate = 0.035;
    const years = 20;

    const monthlyPayment = calculateMonthlyPayment({ principal, annualInterestRate, years });
    const restored = calculatePrincipalFromAnnualPayment({
      annualPayment: monthlyPayment * 12,
      annualInterestRate,
      years,
    });

    expect(restored).toBeCloseTo(principal, 2);
  });

  it('annualInterestRate가 0인 경우에도 원래 principal을 복원한다', () => {
    const principal = 12000;
    const annualInterestRate = 0;
    const years = 10;

    const monthlyPayment = calculateMonthlyPayment({ principal, annualInterestRate, years });
    const restored = calculatePrincipalFromAnnualPayment({
      annualPayment: monthlyPayment * 12,
      annualInterestRate,
      years,
    });

    expect(restored).toBeCloseTo(principal, 2);
  });

  it('annualPayment가 0이면 0을 반환한다', () => {
    expect(
      calculatePrincipalFromAnnualPayment({ annualPayment: 0, annualInterestRate: 0.04, years: 10 })
    ).toBe(0);
  });
});

describe('calculateGraduatedRepaymentSchedule', () => {
  const principal = 30000;
  const annualInterestRate = 0.045;

  test.each([
    [10, 2],
    [20, 4],
    [30, 6],
  ])('years=%i이면 5년 단위로 %i개 구간을 반환한다', (years, expectedTierCount) => {
    const result = calculateGraduatedRepaymentSchedule({ principal, annualInterestRate, years });

    expect(result.tiers).toHaveLength(expectedTierCount);
  });

  it('초기 구간 월상환액은 원리금균등상환액의 80%이고, 구간마다 직전 대비 20%씩 증가한다', () => {
    const years = 20;
    const equalPayment = calculateMonthlyPayment({ principal, annualInterestRate, years });
    const result = calculateGraduatedRepaymentSchedule({ principal, annualInterestRate, years });

    expect(result.tiers[0].monthlyPayment).toBeCloseTo(equalPayment * 0.8, 8);

    for (let i = 1; i < result.tiers.length; i += 1) {
      expect(result.tiers[i].monthlyPayment).toBeCloseTo(result.tiers[i - 1].monthlyPayment * 1.2, 8);
    }
  });

  it('initialMonthlyPayment는 첫 구간, finalMonthlyPayment는 마지막 구간의 월상환액과 일치한다', () => {
    const years = 30;
    const result = calculateGraduatedRepaymentSchedule({ principal, annualInterestRate, years });

    expect(result.initialMonthlyPayment).toBe(result.tiers[0].monthlyPayment);
    expect(result.finalMonthlyPayment).toBe(result.tiers[result.tiers.length - 1].monthlyPayment);
  });
});
