function calculateMonthlyPayment({ principal, annualInterestRate, years }) {
  if (principal === 0) return 0;
  const r = annualInterestRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calculateRepaymentSchedule({ principal, annualInterestRate }) {
  return [10, 20, 30].map((years) => {
    const monthlyPayment = calculateMonthlyPayment({ principal, annualInterestRate, years });
    return { years, monthlyPayment, annualPayment: monthlyPayment * 12 };
  });
}

function calculatePrincipalFromAnnualPayment({ annualPayment, annualInterestRate, years }) {
  if (annualPayment === 0) return 0;
  const monthlyPayment = annualPayment / 12;
  const r = annualInterestRate / 12;
  const n = years * 12;
  if (r === 0) return monthlyPayment * n;
  return (monthlyPayment * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}

const GRADUATED_REPAYMENT_TIER_YEARS = 5;
const GRADUATED_REPAYMENT_INITIAL_RATIO = 0.8;
const GRADUATED_REPAYMENT_TIER_GROWTH_RATE = 1.2;

// 체증식 상환에 대한 공식 표준이 없어 아래 단순화 규칙으로 근사한다:
// 대출기간을 5년 단위 구간으로 나누고, 초기 구간 월상환액을 원리금균등상환액의 80%로 하여
// 구간마다 20%씩 증가시킨다.
function calculateGraduatedRepaymentSchedule({ principal, annualInterestRate, years }) {
  const equalPaymentAmount = calculateMonthlyPayment({ principal, annualInterestRate, years });
  const tierCount = years / GRADUATED_REPAYMENT_TIER_YEARS;

  const tiers = Array.from({ length: tierCount }, (_, index) => {
    const monthlyPayment =
      equalPaymentAmount *
      GRADUATED_REPAYMENT_INITIAL_RATIO *
      Math.pow(GRADUATED_REPAYMENT_TIER_GROWTH_RATE, index);
    return {
      tier: index + 1,
      startYear: index * GRADUATED_REPAYMENT_TIER_YEARS,
      endYear: (index + 1) * GRADUATED_REPAYMENT_TIER_YEARS,
      monthlyPayment,
    };
  });

  return {
    tiers,
    initialMonthlyPayment: tiers[0].monthlyPayment,
    finalMonthlyPayment: tiers[tiers.length - 1].monthlyPayment,
  };
}

module.exports = {
  calculateMonthlyPayment,
  calculateRepaymentSchedule,
  calculatePrincipalFromAnnualPayment,
  calculateGraduatedRepaymentSchedule,
};
