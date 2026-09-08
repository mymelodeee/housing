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

// 거치기간(이자만 납부) 이후 원리금균등상환으로 전환되는 월별 스케줄이다.
// graceMonths=0이면 1개월차부터 바로 원리금균등상환이 시작된다.
function calculateAmortizationSchedule({ principal, annualInterestRate, years, graceMonths = 0 }) {
  const amortMonths = years * 12;
  const totalMonths = graceMonths + amortMonths;
  const monthlyRate = annualInterestRate / 12;
  const regularMonthlyPayment = calculateMonthlyPayment({ principal, annualInterestRate, years });

  let balance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  const rows = [];

  for (let month = 1; month <= totalMonths; month += 1) {
    let interest = 0;
    let principalPaid = 0;
    let payment = 0;

    if (balance > 0 && month <= graceMonths) {
      interest = balance * monthlyRate;
      payment = interest;
    } else if (balance > 0) {
      interest = balance * monthlyRate;
      payment = Math.min(regularMonthlyPayment, balance + interest);
      principalPaid = Math.max(0, payment - interest);
      balance = Math.max(0, balance - principalPaid);
    }

    cumulativeInterest += interest;
    cumulativePrincipal += principalPaid;
    rows.push({ month, payment, interest, principal: principalPaid, balance });
  }

  const graceMonthlyPayment = rows[0]?.payment || 0;
  const cliffMonth = graceMonths > 0 ? graceMonths + 1 : 1;
  const postCliffMonthlyPayment = rows[cliffMonth - 1]?.payment || 0;

  return {
    rows,
    regularMonthlyPayment,
    graceMonthlyPayment,
    cliffMonth,
    postCliffMonthlyPayment,
    cliffIncrease: postCliffMonthlyPayment - graceMonthlyPayment,
    totalInterest: cumulativeInterest,
    totalPrincipal: cumulativePrincipal,
    endBalance: balance,
  };
}

module.exports = {
  calculateMonthlyPayment,
  calculateRepaymentSchedule,
  calculatePrincipalFromAnnualPayment,
  calculateGraduatedRepaymentSchedule,
  calculateAmortizationSchedule,
};
