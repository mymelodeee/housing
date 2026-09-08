const {
  calculateBaseAcquisitionTaxRate,
  resolveAcquisitionTaxRate,
  calculateLocalEducationTaxRate,
  calculateRuralSpecialTaxRate,
  calculateAcquisitionCosts,
} = require('../../src/services/acquisition-tax.service');

describe('calculateBaseAcquisitionTaxRate', () => {
  it('6억원 이하는 1%', () => {
    expect(calculateBaseAcquisitionTaxRate(60000)).toBe(0.01);
    expect(calculateBaseAcquisitionTaxRate(50000)).toBe(0.01);
  });

  it('9억원 초과는 3%', () => {
    expect(calculateBaseAcquisitionTaxRate(90001)).toBe(0.03);
    expect(calculateBaseAcquisitionTaxRate(150000)).toBe(0.03);
  });

  it('6억 초과~9억 이하는 구간 산식으로 1~3% 사이 값을 반환한다', () => {
    const rate = calculateBaseAcquisitionTaxRate(75000);
    expect(rate).toBeGreaterThan(0.01);
    expect(rate).toBeLessThan(0.03);
  });

  it('9억원 경계에서 정확히 3%가 된다', () => {
    expect(calculateBaseAcquisitionTaxRate(90000)).toBe(0.03);
  });
});

describe('resolveAcquisitionTaxRate', () => {
  it('무주택자의 첫 주택 취득은 기본세율을 적용한다', () => {
    const result = resolveAcquisitionTaxRate({
      salePrice: 95000,
      isRegulatedArea: true,
      homeCountAfterPurchase: 1,
      isHeavyTaxExempt: false,
    });

    expect(result.isHeavy).toBe(false);
    expect(result.rate).toBe(0.03);
  });

  it('규제지역 2주택자는 8% 중과', () => {
    const result = resolveAcquisitionTaxRate({
      salePrice: 95000,
      isRegulatedArea: true,
      homeCountAfterPurchase: 2,
      isHeavyTaxExempt: false,
    });

    expect(result.rate).toBe(0.08);
    expect(result.isHeavy).toBe(true);
  });

  it('규제지역 3주택 이상은 12% 중과', () => {
    const result = resolveAcquisitionTaxRate({
      salePrice: 95000,
      isRegulatedArea: true,
      homeCountAfterPurchase: 3,
      isHeavyTaxExempt: false,
    });

    expect(result.rate).toBe(0.12);
  });

  it('비규제지역은 3주택부터 8%, 4주택부터 12%', () => {
    expect(
      resolveAcquisitionTaxRate({ salePrice: 95000, isRegulatedArea: false, homeCountAfterPurchase: 2, isHeavyTaxExempt: false }).rate
    ).toBe(0.03);
    expect(
      resolveAcquisitionTaxRate({ salePrice: 95000, isRegulatedArea: false, homeCountAfterPurchase: 3, isHeavyTaxExempt: false }).rate
    ).toBe(0.08);
    expect(
      resolveAcquisitionTaxRate({ salePrice: 95000, isRegulatedArea: false, homeCountAfterPurchase: 4, isHeavyTaxExempt: false }).rate
    ).toBe(0.12);
  });

  it('중과 예외를 선택하면 다주택이어도 기본세율을 적용한다', () => {
    const result = resolveAcquisitionTaxRate({
      salePrice: 95000,
      isRegulatedArea: true,
      homeCountAfterPurchase: 3,
      isHeavyTaxExempt: true,
    });

    expect(result.rate).toBe(0.03);
    expect(result.isHeavy).toBe(false);
  });
});

describe('calculateLocalEducationTaxRate', () => {
  it('중과가 아니면 취득세율의 10%', () => {
    expect(calculateLocalEducationTaxRate({ rate: 0.03, isHeavy: false })).toBeCloseTo(0.003, 8);
  });

  it('중과이면 0.4% 고정', () => {
    expect(calculateLocalEducationTaxRate({ rate: 0.12, isHeavy: true })).toBe(0.004);
  });
});

describe('calculateRuralSpecialTaxRate', () => {
  it('전용면적 85㎡ 이하는 0', () => {
    expect(calculateRuralSpecialTaxRate({ rate: 0.03, isHeavy: false, exclusiveArea: 84.98 })).toBe(0);
  });

  it('85㎡ 초과 기본세율은 0.2%', () => {
    expect(calculateRuralSpecialTaxRate({ rate: 0.03, isHeavy: false, exclusiveArea: 114.9 })).toBe(0.002);
  });

  it('85㎡ 초과 12% 중과는 1%', () => {
    expect(calculateRuralSpecialTaxRate({ rate: 0.12, isHeavy: true, exclusiveArea: 114.9 })).toBe(0.01);
  });

  it('85㎡ 초과 8% 중과는 0.6%', () => {
    expect(calculateRuralSpecialTaxRate({ rate: 0.08, isHeavy: true, exclusiveArea: 114.9 })).toBe(0.006);
  });
});

describe('calculateAcquisitionCosts', () => {
  it('9.5억, 규제지역, 무주택 첫 취득, 전용 84.98㎡ 기준 합계를 계산한다', () => {
    const result = calculateAcquisitionCosts({
      salePrice: 95000,
      isRegulatedArea: true,
      homeCountAfterPurchase: 1,
      exclusiveArea: 84.98,
      isHeavyTaxExempt: false,
    });

    expect(result.acquisitionTax).toBe(Math.round(95000 * 10000 * 0.03));
    expect(result.ruralSpecialTax).toBe(0);
    expect(result.totalTax).toBe(result.acquisitionTax + result.localEducationTax + result.ruralSpecialTax);
  });
});
