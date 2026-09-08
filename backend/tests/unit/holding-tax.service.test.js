const {
  resolvePropertyFairMarketValueRatio,
  calculatePropertyTax,
  calculateComprehensiveTax,
  calculateHoldingTaxEstimate,
} = require('../../src/services/holding-tax.service');

describe('resolvePropertyFairMarketValueRatio', () => {
  it('1세대1주택이 아니면 일반 공정시장가액비율 60%', () => {
    expect(resolvePropertyFairMarketValueRatio({ publicPriceWon: 900000000, isOneHouse: false })).toBe(0.6);
  });

  it('1세대1주택 공시가격 3억원 이하는 43%', () => {
    expect(resolvePropertyFairMarketValueRatio({ publicPriceWon: 300000000, isOneHouse: true })).toBe(0.43);
  });

  it('1세대1주택 공시가격 3억 초과~6억 이하는 44%', () => {
    expect(resolvePropertyFairMarketValueRatio({ publicPriceWon: 600000000, isOneHouse: true })).toBe(0.44);
  });

  it('1세대1주택 공시가격 6억 초과는 45%', () => {
    expect(resolvePropertyFairMarketValueRatio({ publicPriceWon: 600000001, isOneHouse: true })).toBe(0.45);
  });
});

describe('calculatePropertyTax', () => {
  it('1세대1주택 공시가격 9억원(만원 단위 90000)은 특례세율을 적용한다', () => {
    const result = calculatePropertyTax({ publicPrice: 90000, isOneHouse: true, includeUrbanAreaTax: false });

    expect(result.isSpecialOneHouse).toBe(true);
    expect(result.fairMarketValueRatio).toBe(0.45);
    expect(result.propertyTax).toBeGreaterThan(0);
    expect(result.localEducationTax).toBe(Math.round(result.propertyTax * 0.2));
    expect(result.total).toBe(result.propertyTax + result.localEducationTax);
  });

  it('공시가격이 9억원을 초과하면 1세대1주택이어도 특례세율을 적용하지 않는다', () => {
    const result = calculatePropertyTax({ publicPrice: 90001, isOneHouse: true });

    expect(result.isSpecialOneHouse).toBe(false);
  });

  it('도시지역분을 포함하면 합계에 0.14%가 추가된다', () => {
    const withUrban = calculatePropertyTax({ publicPrice: 90000, isOneHouse: false, includeUrbanAreaTax: true });
    const withoutUrban = calculatePropertyTax({ publicPrice: 90000, isOneHouse: false, includeUrbanAreaTax: false });

    expect(withUrban.urbanAreaTax).toBeGreaterThan(0);
    expect(withoutUrban.urbanAreaTax).toBe(0);
    expect(withUrban.total).toBe(withUrban.propertyTax + withUrban.localEducationTax + withUrban.urbanAreaTax);
  });
});

describe('calculateComprehensiveTax', () => {
  it('1세대1주택 공시가격 합계가 12억원 이하면 과세표준이 0이다', () => {
    const result = calculateComprehensiveTax({ totalPublicPriceSum: 120000, isOneHouse: true, homeCount: 1 });

    expect(result.taxableBase).toBe(0);
    expect(result.total).toBe(0);
  });

  it('1세대1주택은 12억원 공제, 그 외는 9억원 공제를 적용한다', () => {
    const oneHouse = calculateComprehensiveTax({ totalPublicPriceSum: 150000, isOneHouse: true, homeCount: 1 });
    const general = calculateComprehensiveTax({ totalPublicPriceSum: 150000, isOneHouse: false, homeCount: 2 });

    expect(oneHouse.deduction).toBe(120000);
    expect(general.deduction).toBe(90000);
    expect(general.taxableBase).toBeGreaterThan(oneHouse.taxableBase);
  });

  it('3주택 이상은 동일 과세표준에서 더 높은 세율을 적용한다', () => {
    const twoHomes = calculateComprehensiveTax({ totalPublicPriceSum: 300000, isOneHouse: false, homeCount: 2 });
    const threeHomes = calculateComprehensiveTax({ totalPublicPriceSum: 300000, isOneHouse: false, homeCount: 3 });

    expect(threeHomes.comprehensiveTax).toBeGreaterThan(twoHomes.comprehensiveTax);
  });

  it('농특세는 종부세 본세의 20%다', () => {
    const result = calculateComprehensiveTax({ totalPublicPriceSum: 300000, isOneHouse: false, homeCount: 2 });

    expect(result.ruralSpecialTax).toBe(Math.round(result.comprehensiveTax * 0.2));
  });
});

describe('calculateHoldingTaxEstimate', () => {
  it('재산세와 종부세를 합산해 연간 보유세 추정치를 반환한다', () => {
    const result = calculateHoldingTaxEstimate({ publicPrice: 150000, homeCount: 1, includeUrbanAreaTax: false });

    expect(result.totalAnnualHoldingTax).toBe(result.propertyTax.total + result.comprehensiveTax.total);
  });

  it('homeCount가 1이면 isOneHouse가 true다', () => {
    const result = calculateHoldingTaxEstimate({ publicPrice: 90000, homeCount: 1 });
    expect(result.isOneHouse).toBe(true);
  });

  it('homeCount가 2 이상이면 isOneHouse가 false다', () => {
    const result = calculateHoldingTaxEstimate({ publicPrice: 90000, homeCount: 2 });
    expect(result.isOneHouse).toBe(false);
  });
});
