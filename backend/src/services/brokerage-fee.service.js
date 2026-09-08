// 공인중개사법 시행규칙 별표1(주택 중개보수 상한요율) + 서울특별시 주택 중개보수 등에
// 관한 조례 별표1(2021-12-30 시행, 2026-09-08 land.seoul.go.kr 공식 페이지로 재확인)
// 기준. 시·도 조례가 시행규칙이 정한 상한요율 범위 내에서 구체 요율을 정하며,
// 서울/경기/인천 등 수도권 조례는 동일한 구간·요율을 쓴다. 이 값은 법정 "상한요율"이며
// 고정 수수료가 아니다 — 실제 중개보수는 이 상한요율 × 거래금액 이내에서 중개의뢰인과
// 개업공인중개사가 협의해 정한다. 매매(SALE)와 임대차(LEASE)는 구간·요율이 서로 달라
// 절대 혼용하지 않는다.
//
// 저가 구간(매매 2억원 미만/임대차 1억원 미만)에는 법정 정액 한도액(한도액 이내로
// 별도 제한)도 있으나, 이 서비스는 7~15억원대 아파트만 다루어 그 구간에 진입할 일이
// 없으므로 한도액 로직은 두지 않는다 — 항상 "상한요율 × 취득가액"으로만 계산한다.
const MANWON = 10000;

// 주택 매매·교환 중개보수 상한요율표.
function resolveSaleBrokerageRate(salePrice) {
  if (salePrice < 5000) return 0.006;
  if (salePrice < 20000) return 0.005;
  if (salePrice < 90000) return 0.004;
  if (salePrice < 120000) return 0.005;
  if (salePrice < 150000) return 0.006;
  return 0.007;
}

// 주택 임대차 중개보수 상한요율표.
function resolveLeaseBrokerageRate(dealAmount) {
  if (dealAmount < 5000) return 0.005;
  if (dealAmount < 10000) return 0.004;
  if (dealAmount < 60000) return 0.003;
  if (dealAmount < 120000) return 0.004;
  if (dealAmount < 150000) return 0.005;
  return 0.006;
}

function calculateBrokerageFeeFromRate(capRate, { dealAmount, negotiatedRatePercent, includeVat = false }) {
  let rate = capRate;
  let isCapped = false;

  if (typeof negotiatedRatePercent === 'number') {
    const negotiatedRate = negotiatedRatePercent / 100;
    if (negotiatedRate > capRate) {
      isCapped = true;
    } else {
      rate = Math.max(0, negotiatedRate);
    }
  }

  // 중개보수 = 취득가액 × 상한요율(또는 상한 이내 협의요율). 정액 한도액은 적용하지 않는다.
  const fee = dealAmount * MANWON * rate;
  const vat = includeVat ? Math.round(fee * 0.1) : 0;

  return {
    // 부동소수점 연산(예: 0.007*100)이 0.7000000000000001처럼 표시되는 것을 방지하기 위해
    // 소수 넷째 자리에서 반올림한다(요율은 전부 소수점 첫째~둘째 자리이므로 정밀도 손실 없음).
    appliedRatePercent: Math.round(rate * 100 * 10000) / 10000,
    capRatePercent: Math.round(capRate * 100 * 10000) / 10000,
    isCapped,
    fee: Math.round(fee),
    vat,
    totalFee: Math.round(fee) + vat
  };
}

function calculateSaleBrokerageFee({ salePrice, negotiatedRatePercent, includeVat = false }) {
  return calculateBrokerageFeeFromRate(resolveSaleBrokerageRate(salePrice), {
    dealAmount: salePrice,
    negotiatedRatePercent,
    includeVat
  });
}

function calculateLeaseBrokerageFee({ dealAmount, negotiatedRatePercent, includeVat = false }) {
  return calculateBrokerageFeeFromRate(resolveLeaseBrokerageRate(dealAmount), {
    dealAmount,
    negotiatedRatePercent,
    includeVat
  });
}

// 오피스텔 중개보수 요율(공인중개사법 시행규칙 제20조제4항제1호 및 별표2, 국토교통부령
// 제1611호(2026-08-11 개정) 기준으로 2026-09-09 law.go.kr 재확인). 전용면적 85㎡
// 이하이면서 상·하수도 완비 전용 입식 부엌·전용 수세식 화장실 및 목욕시설을 모두 갖춘
// 오피스텔에만 적용되는 요율이며, 요건을 갖추지 못하면 "그 밖의 중개대상물" 요율(0.9%
// 이내 협의)이 적용된다. 이 서비스는 현재 오피스텔 매물 자체를 취급하지 않아(매물 유형
// 구분 컬럼이 없음) 요건 판정 로직 없이 요건 충족을 전제로 한 요율만 제공한다 — 오피스텔
// 매물을 실제로 취급하게 되면 요건 판정을 먼저 구현해야 한다.
const OFFICETEL_SALE_RATE_PERCENT = 0.5;
const OFFICETEL_LEASE_RATE_PERCENT = 0.4;

function calculateOfficetelBrokerageFee({ dealAmount, isLease = false, negotiatedRatePercent, includeVat = false }) {
  const capRate = (isLease ? OFFICETEL_LEASE_RATE_PERCENT : OFFICETEL_SALE_RATE_PERCENT) / 100;
  return calculateBrokerageFeeFromRate(capRate, { dealAmount, negotiatedRatePercent, includeVat });
}

module.exports = {
  resolveSaleBrokerageRate,
  resolveLeaseBrokerageRate,
  calculateSaleBrokerageFee,
  calculateLeaseBrokerageFee,
  calculateOfficetelBrokerageFee,
  OFFICETEL_SALE_RATE_PERCENT,
  OFFICETEL_LEASE_RATE_PERCENT
};
