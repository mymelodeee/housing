const loanLimitService = require('./loan-limit.service');
const repaymentService = require('./repayment.service');
const regulationService = require('./regulation.service');

const FORCED_HOUSING_TIER = '1주택';
const FORCED_IS_FIRST_TIME_BUYER = false;

const INTEREST_RATE_SOURCE =
  '우리은행 우리아파트론 변동금리 신규취급 하단 연 4.37%(2026.6.11 확인)와 한국은행 신규취급액 기준 ' +
  '전체은행 가중평균금리 연 4.34%(2026.3월)를 교차검증한 대표값. 우리은행 공식 고시금리 페이지 자동조회 ' +
  '불가로 뉴스 보도 기반 대체값을 사용했으며 실제 고시금리와 다를 수 있음.';

function calculateDsrUsageRate({ maxLoanAmount, annualIncome, annualBonus }) {
  const schedule = repaymentService.calculateRepaymentSchedule({
    principal: maxLoanAmount,
    annualInterestRate: loanLimitService.DSR_REFERENCE_ANNUAL_INTEREST_RATE
  });
  const referenceSchedule = schedule.find((s) => s.years === loanLimitService.DSR_REFERENCE_YEARS);
  const actualAnnualPayment = referenceSchedule.annualPayment;
  const dsrAllowedAnnualPayment = (annualIncome + annualBonus) * loanLimitService.DSR_CAP_RATIO;
  if (dsrAllowedAnnualPayment === 0) return 0;
  return actualAnnualPayment / dsrAllowedAnnualPayment;
}

function buildScenario({ ownershipStructure, salePrice, isRegulatedArea, annualIncome, annualBonus, availableCapital, isLandTransactionPermissionZone }) {
  const loanLimit = loanLimitService.calculateMaxLoanAmount({
    salePrice,
    housingOwnershipTier: FORCED_HOUSING_TIER,
    isFirstTimeBuyer: FORCED_IS_FIRST_TIME_BUYER,
    isRegulatedArea,
    annualIncome,
    annualBonus
  });
  const annualInterestRate = loanLimitService.DSR_REFERENCE_ANNUAL_INTEREST_RATE;
  const schedule = repaymentService.calculateRepaymentSchedule({
    principal: loanLimit.maxLoanAmount,
    annualInterestRate
  });
  const monthly = (years) => Math.round(schedule.find((s) => s.years === years).monthlyPayment);
  const graduatedMonthly = (years) => {
    const graduated = repaymentService.calculateGraduatedRepaymentSchedule({
      principal: loanLimit.maxLoanAmount,
      annualInterestRate,
      years
    });
    return {
      initialMonthlyPayment: Math.round(graduated.initialMonthlyPayment),
      finalMonthlyPayment: Math.round(graduated.finalMonthlyPayment)
    };
  };
  const requiredCapital = salePrice - loanLimit.maxLoanAmount - availableCapital;
  const isMortgageInRegulatedArea = isRegulatedArea && loanLimit.maxLoanAmount > 0;

  return {
    ownershipStructure,
    ltvPercent: loanLimit.ltvPercent,
    maxLoanAmount: loanLimit.maxLoanAmount,
    requiredCapital,
    capitalSufficient: requiredCapital <= 0,
    dsrUsageRate: calculateDsrUsageRate({ maxLoanAmount: loanLimit.maxLoanAmount, annualIncome, annualBonus }),
    monthlyRepayment10y: monthly(10),
    monthlyRepayment20y: monthly(20),
    monthlyRepayment30y: monthly(30),
    occupancyRequirementMonths: regulationService.determineOccupancyRequirementMonths({
      isLandTransactionPermissionZone,
      isMortgageInRegulatedArea
    }),
    interestRatePercent: annualInterestRate * 100,
    interestRateSource: INTEREST_RATE_SOURCE,
    graduatedRepayment10y: graduatedMonthly(10),
    graduatedRepayment20y: graduatedMonthly(20),
    graduatedRepayment30y: graduatedMonthly(30)
  };
}

function buildScenarios({ salePrice, isRegulatedArea, annualIncome, annualBonus, availableCapital, isLandTransactionPermissionZone }) {
  return [
    buildScenario({
      ownershipStructure: '단독',
      salePrice, isRegulatedArea, availableCapital, isLandTransactionPermissionZone,
      annualIncome, annualBonus
    }),
    buildScenario({
      ownershipStructure: '부부합산',
      salePrice, isRegulatedArea, availableCapital, isLandTransactionPermissionZone,
      annualIncome: annualIncome * 2, annualBonus: annualBonus * 2
    })
  ];
}

function selectRecommendedScenario(scenarios) {
  const eligible = scenarios.filter((s) => s.capitalSufficient);
  if (eligible.length === 0) return null;

  eligible.sort((a, b) => b.maxLoanAmount - a.maxLoanAmount || a.dsrUsageRate - b.dsrUsageRate);

  const best = eligible[0];
  const tied = eligible.filter((s) => s.maxLoanAmount === best.maxLoanAmount && s.dsrUsageRate === best.dsrUsageRate);
  if (tied.length > 1) return '부부합산';
  return best.ownershipStructure;
}

module.exports = { buildScenarios, selectRecommendedScenario, calculateDsrUsageRate };
