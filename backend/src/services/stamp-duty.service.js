// 인지세법 제3조 별표(부동산 소유권 이전 계약서) 기준 정액 인지세. 매수인 부담비율은
// 계약 당사자 간 협의사항이라 정책값이 아닌 사용자 입력으로 분리한다.
function calculateStampDuty(salePrice) {
  if (salePrice <= 1000) return 0;
  if (salePrice <= 3000) return 20000;
  if (salePrice <= 5000) return 40000;
  if (salePrice <= 10000) return 70000;
  if (salePrice <= 100000) return 150000;
  return 350000;
}

function calculateBuyerStampDuty({ salePrice, buyerSharePercent = 100 }) {
  const totalStampDuty = calculateStampDuty(salePrice);
  return Math.round(totalStampDuty * (buyerSharePercent / 100));
}

module.exports = {
  calculateStampDuty,
  calculateBuyerStampDuty
};
