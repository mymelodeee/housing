const { getLtvPercent, getRegionalLoanCapAmount } = require('./regulation.service');
const { calculatePrincipalFromAnnualPayment } = require('./repayment.service');

const DSR_CAP_RATIO = 0.4;
// 도메인 §5.2/§5.3에 DSR 역산 기준금리·만기가 명시되어 있지 않아, 30년 만기(최장 대출기간 관행)와
// 시중은행 주담대 평균 수준인 연 4.0%를 고정 가정으로 사용한다.
const DSR_REFERENCE_YEARS = 30;
const DSR_REFERENCE_ANNUAL_INTEREST_RATE = 0.04;

function calculateLtvCapAmount({ salePrice, housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea }) {
  const ltvPercent = getLtvPercent({ housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea });
  const ltvCapAmount = Math.floor((salePrice * ltvPercent) / 100);
  return { ltvPercent, ltvCapAmount };
}

function calculateDsrCapAmount({ annualIncome, annualBonus }) {
  const annualPayment = (annualIncome + annualBonus) * DSR_CAP_RATIO;
  return calculatePrincipalFromAnnualPayment({
    annualPayment,
    annualInterestRate: DSR_REFERENCE_ANNUAL_INTEREST_RATE,
    years: DSR_REFERENCE_YEARS
  });
}

function calculateMaxLoanAmount({
  salePrice, housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea, annualIncome, annualBonus
}) {
  const { ltvPercent, ltvCapAmount } = calculateLtvCapAmount({
    salePrice, housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea
  });
  const dsrCapAmount = calculateDsrCapAmount({ annualIncome, annualBonus });
  const regionalCapAmount = getRegionalLoanCapAmount(isRegulatedArea);

  const caps = [ltvCapAmount, dsrCapAmount, regionalCapAmount].filter((v) => v !== null);
  const maxLoanAmount = Math.floor(Math.min(...caps));

  return { ltvPercent, ltvCapAmount, dsrCapAmount, regionalCapAmount, maxLoanAmount };
}

module.exports = {
  calculateLtvCapAmount,
  calculateDsrCapAmount,
  calculateMaxLoanAmount,
  DSR_CAP_RATIO,
  DSR_REFERENCE_YEARS,
  DSR_REFERENCE_ANNUAL_INTEREST_RATE
};
