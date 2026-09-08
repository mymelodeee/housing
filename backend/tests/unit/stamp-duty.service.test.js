const { calculateStampDuty, calculateBuyerStampDuty } = require('../../src/services/stamp-duty.service');

describe('calculateStampDuty', () => {
  it('1천만원 이하는 0원', () => {
    expect(calculateStampDuty(500)).toBe(0);
  });

  it('1천만 초과 3천만 이하는 2만원', () => {
    expect(calculateStampDuty(3000)).toBe(20000);
  });

  it('1억 초과 10억 이하는 15만원', () => {
    expect(calculateStampDuty(95000)).toBe(150000);
  });

  it('10억 초과는 35만원', () => {
    expect(calculateStampDuty(150000)).toBe(350000);
  });
});

describe('calculateBuyerStampDuty', () => {
  it('매수인 부담비율 100%면 전액 부담', () => {
    expect(calculateBuyerStampDuty({ salePrice: 95000, buyerSharePercent: 100 })).toBe(150000);
  });

  it('매수인 부담비율 50%면 절반만 부담', () => {
    expect(calculateBuyerStampDuty({ salePrice: 95000, buyerSharePercent: 50 })).toBe(75000);
  });
});
