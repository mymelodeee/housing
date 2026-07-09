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

module.exports = { calculateMonthlyPayment, calculateRepaymentSchedule, calculatePrincipalFromAnnualPayment };
