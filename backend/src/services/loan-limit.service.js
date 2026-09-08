const { getLtvPercent, getRegionalLoanCapAmount } = require('./regulation.service');
const { calculatePrincipalFromAnnualPayment } = require('./repayment.service');

const DSR_CAP_RATIO = 0.4;
// 도메인 §5.2/§5.3에 DSR 역산 만기가 명시되어 있지 않아 30년 만기(최장 대출기간 관행)를 고정 가정으로
// 쓴다. 기준금리는 더 이상 이 파일에 고정하지 않고, 호출부가 market-interest-rate.service.js를 통해
// DB(한국은행 매월 발표 가중평균금리를 사람이 확인해 반영)에서 조회한 값을 annualInterestRate로 넘긴다.
const DSR_REFERENCE_YEARS = 30;

function calculateLtvCapAmount({ salePrice, housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea }) {
  const ltvPercent = getLtvPercent({ housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea });
  const ltvCapAmount = Math.floor((salePrice * ltvPercent) / 100);
  return { ltvPercent, ltvCapAmount };
}

function calculateDsrCapAmount({ annualIncome, annualBonus, annualInterestRate }) {
  const annualPayment = (annualIncome + annualBonus) * DSR_CAP_RATIO;
  return calculatePrincipalFromAnnualPayment({
    annualPayment,
    annualInterestRate,
    years: DSR_REFERENCE_YEARS
  });
}

function calculateMaxLoanAmount({
  salePrice, housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea, annualIncome, annualBonus, annualInterestRate
}) {
  const { ltvPercent, ltvCapAmount } = calculateLtvCapAmount({
    salePrice, housingOwnershipTier, isFirstTimeBuyer, isRegulatedArea
  });
  const dsrCapAmount = calculateDsrCapAmount({ annualIncome, annualBonus, annualInterestRate });
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
  DSR_REFERENCE_YEARS
};
