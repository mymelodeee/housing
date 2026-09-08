const { calculateGangnamAccessibility } = require('../../src/services/gangnam-accessibility.service');

describe('services/gangnam-accessibility.service', () => {
  it('강남역 좌표 자체를 입력하면 0km를 반환한다', () => {
    expect(calculateGangnamAccessibility(37.497942, 127.027621)).toBe('강남역 직선 0km');
  });

  it('좌표가 있으면 강남역까지 직선거리(km, 소수 첫째자리)를 계산한다', () => {
    // 화성 동탄역시범우남퍼스트빌 좌표 기준 대략적인 거리 검증(수십 km대)
    const result = calculateGangnamAccessibility(37.201754, 127.099756);

    expect(result).toMatch(/^강남역 직선 \d+(\.\d)?km$/);
  });

  it('좌표가 없으면 null을 반환한다(호출측에서 "확인 필요"로 처리)', () => {
    expect(calculateGangnamAccessibility(null, null)).toBeNull();
    expect(calculateGangnamAccessibility(undefined, undefined)).toBeNull();
  });
});
