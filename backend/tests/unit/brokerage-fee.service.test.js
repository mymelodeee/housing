const {
  resolveSaleBrokerageRate,
  resolveLeaseBrokerageRate,
  calculateSaleBrokerageFee,
  calculateLeaseBrokerageFee,
  calculateOfficetelBrokerageFee,
} = require('../../src/services/brokerage-fee.service');

// 만원 단위 경계값. 사용자가 제시한 원 단위 경계값(49,999,999 / 50,000,000 / 199,999,999 /
// 200,000,000 / 899,999,999 / 900,000,000 / 1,200,000,000 / 1,500,000,000원)을
// 이 서비스의 입력 단위(만원)로 환산한 값이다.
const JUST_BELOW_5000 = 4999.9999; // 49,999,999원
const EXACT_5000 = 5000; // 50,000,000원
const JUST_BELOW_20000 = 19999.9999; // 199,999,999원
const EXACT_20000 = 20000; // 200,000,000원
const JUST_BELOW_90000 = 89999.9999; // 899,999,999원
const EXACT_90000 = 90000; // 900,000,000원
const EXACT_120000 = 120000; // 1,200,000,000원
const EXACT_150000 = 150000; // 1,500,000,000원

describe('resolveSaleBrokerageRate (주택 매매·교환)', () => {
  it('5천만원 미만은 0.6%', () => {
    expect(resolveSaleBrokerageRate(JUST_BELOW_5000)).toBe(0.006);
  });

  it('5천만원 경계(포함)부터는 0.5%', () => {
    expect(resolveSaleBrokerageRate(EXACT_5000)).toBe(0.005);
  });

  it('2억원 미만은 0.5%', () => {
    expect(resolveSaleBrokerageRate(JUST_BELOW_20000)).toBe(0.005);
  });

  it('2억원 경계(포함)부터는 0.4%', () => {
    expect(resolveSaleBrokerageRate(EXACT_20000)).toBe(0.004);
  });

  it('9억원 미만은 0.4%', () => {
    expect(resolveSaleBrokerageRate(JUST_BELOW_90000)).toBe(0.004);
  });

  it('9억원 경계(포함)부터는 0.5%', () => {
    expect(resolveSaleBrokerageRate(EXACT_90000)).toBe(0.005);
  });

  it('12억원 경계(포함)부터는 0.6%', () => {
    expect(resolveSaleBrokerageRate(EXACT_120000)).toBe(0.006);
  });

  it('15억원 경계(포함)부터는 0.7%', () => {
    expect(resolveSaleBrokerageRate(EXACT_150000)).toBe(0.007);
  });
});

describe('resolveLeaseBrokerageRate (주택 임대차)', () => {
  it('5천만원 미만은 0.5%', () => {
    expect(resolveLeaseBrokerageRate(JUST_BELOW_5000)).toBe(0.005);
  });

  it('5천만원 경계(포함)부터는 0.4%', () => {
    expect(resolveLeaseBrokerageRate(EXACT_5000)).toBe(0.004);
  });

  it('1억원 미만은 0.4%', () => {
    expect(resolveLeaseBrokerageRate(9999.9999)).toBe(0.004);
  });

  it('1억원 경계(포함)부터는 0.3%', () => {
    expect(resolveLeaseBrokerageRate(10000)).toBe(0.003);
  });

  it('6억원 미만은 0.3%', () => {
    expect(resolveLeaseBrokerageRate(59999.9999)).toBe(0.003);
  });

  it('6억원 경계(포함)부터는 0.4%', () => {
    expect(resolveLeaseBrokerageRate(60000)).toBe(0.004);
  });

  it('12억원 경계(포함)부터는 0.5%', () => {
    expect(resolveLeaseBrokerageRate(EXACT_120000)).toBe(0.005);
  });

  it('15억원 경계(포함)부터는 0.6%', () => {
    expect(resolveLeaseBrokerageRate(EXACT_150000)).toBe(0.006);
  });
});

describe('calculateSaleBrokerageFee', () => {
  it('협의요율을 지정하지 않으면 상한요율 × 취득가액으로 계산한다(한도액 미적용)', () => {
    const result = calculateSaleBrokerageFee({ salePrice: 95000 });

    expect(result.appliedRatePercent).toBeCloseTo(0.5, 8);
    expect(result.fee).toBe(Math.round(95000 * 10000 * 0.005));
    expect(result.isCapped).toBe(false);
  });

  it('협의요율이 상한보다 낮으면 협의요율을 그대로 적용한다', () => {
    const result = calculateSaleBrokerageFee({ salePrice: 95000, negotiatedRatePercent: 0.3 });

    expect(result.appliedRatePercent).toBeCloseTo(0.3, 8);
    expect(result.isCapped).toBe(false);
    expect(result.fee).toBe(Math.round(95000 * 10000 * 0.003));
  });

  it('협의요율이 상한을 초과하면 상한으로 제한하고 isCapped를 true로 표시한다', () => {
    const result = calculateSaleBrokerageFee({ salePrice: 95000, negotiatedRatePercent: 1.0 });

    expect(result.isCapped).toBe(true);
    expect(result.appliedRatePercent).toBeCloseTo(0.5, 8);
  });

  it('저가 구간이어도 정액 한도액을 적용하지 않고 상한요율 × 취득가액 그대로 계산한다', () => {
    const result = calculateSaleBrokerageFee({ salePrice: 4999 });

    // 4999만원 × 0.6% = 299,940원. 법정 한도액(25만원)이 있는 구간이지만
    // 이 서비스는 7~15억원대만 다루므로 한도액을 적용하지 않는다.
    expect(result.fee).toBe(Math.round(4999 * 10000 * 0.006));
  });

  it('15억원 이상 고가 구간은 0.7% × 취득가액으로 계산한다', () => {
    const result = calculateSaleBrokerageFee({ salePrice: 165000 });

    expect(result.appliedRatePercent).toBeCloseTo(0.7, 8);
    expect(result.fee).toBe(Math.round(165000 * 10000 * 0.007));
  });

  it('VAT 포함 옵션을 켜면 수수료의 10%를 더한다', () => {
    const result = calculateSaleBrokerageFee({ salePrice: 95000, includeVat: true });

    expect(result.vat).toBe(Math.round(result.fee * 0.1));
    expect(result.totalFee).toBe(result.fee + result.vat);
  });
});

describe('calculateLeaseBrokerageFee', () => {
  it('임대차 거래금액 기준으로 매매와 다른 요율을 적용한다', () => {
    const result = calculateLeaseBrokerageFee({ dealAmount: 95000 });

    // 임대차 9.5억은 6억~12억 구간 → 0.4% (매매였다면 9억~12억 0.5%)
    expect(result.appliedRatePercent).toBeCloseTo(0.4, 8);
    expect(result.fee).toBe(Math.round(95000 * 10000 * 0.004));
  });

  it('저가 구간이어도 정액 한도액을 적용하지 않는다', () => {
    const result = calculateLeaseBrokerageFee({ dealAmount: 4999 });

    expect(result.fee).toBe(Math.round(4999 * 10000 * 0.005));
  });
});

describe('calculateOfficetelBrokerageFee (오피스텔, 주택 요율과 혼용 금지)', () => {
  it('매매는 가격 구간과 무관하게 0.5% 단일 요율을 적용한다(주택 매매 요율표를 쓰지 않는다)', () => {
    const cheap = calculateOfficetelBrokerageFee({ dealAmount: 20000 });
    const expensive = calculateOfficetelBrokerageFee({ dealAmount: 165000 });

    expect(cheap.appliedRatePercent).toBeCloseTo(0.5, 8);
    expect(expensive.appliedRatePercent).toBeCloseTo(0.5, 8);
    expect(expensive.fee).toBe(Math.round(165000 * 10000 * 0.005));
  });

  it('임대차는 0.4% 단일 요율을 적용하며 매매 요율과 다르다', () => {
    const result = calculateOfficetelBrokerageFee({ dealAmount: 95000, isLease: true });

    expect(result.appliedRatePercent).toBeCloseTo(0.4, 8);
  });

  it('아파트 매매 요율(가변)과 오피스텔 매매 요율(고정 0.5%)은 9억원 구간에서 값이 갈린다', () => {
    const apartment = calculateSaleBrokerageFee({ salePrice: 95000 });
    const officetel = calculateOfficetelBrokerageFee({ dealAmount: 95000 });

    expect(apartment.appliedRatePercent).toBeCloseTo(0.5, 8);
    expect(officetel.appliedRatePercent).toBeCloseTo(0.5, 8);

    const apartmentAtCap = calculateSaleBrokerageFee({ salePrice: 165000 });
    const officetelAtSamePrice = calculateOfficetelBrokerageFee({ dealAmount: 165000 });
    expect(apartmentAtCap.appliedRatePercent).toBeCloseTo(0.7, 8);
    expect(officetelAtSamePrice.appliedRatePercent).toBeCloseTo(0.5, 8);
  });
});
