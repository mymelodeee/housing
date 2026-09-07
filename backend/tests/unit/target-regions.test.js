const {
  TARGET_REGIONS,
  getTargetRegionCodes,
  getTargetRegion,
  isTargetRegion,
  getCities,
  getLawdCdsByCity
} = require('../../src/config/target-regions');

describe('config/target-regions', () => {
  describe('getTargetRegionCodes', () => {
    it('TARGET_REGIONS의 모든 lawdCd를 중복 없이 반환한다', () => {
      const codes = getTargetRegionCodes();

      expect(codes).toHaveLength(new Set(TARGET_REGIONS.map((r) => r.lawdCd)).size);
      TARGET_REGIONS.forEach((region) => {
        expect(codes).toContain(region.lawdCd);
      });
    });
  });

  describe('getTargetRegion', () => {
    it('대상 지역의 lawdCd로 조회 시 해당 region 객체를 반환한다', () => {
      expect(getTargetRegion('41597')).toEqual({ regionName: '화성시 동탄구', lawdCd: '41597', city: '화성시' });
    });

    it('비대상 지역(평택 41220)으로 조회 시 null을 반환한다', () => {
      expect(getTargetRegion('41220')).toBeNull();
    });
  });

  describe('isTargetRegion', () => {
    it('대상 지역이면 true를 반환한다', () => {
      expect(isTargetRegion('41465')).toBe(true);
    });

    it('비대상 지역(용인 기흥 41463)이면 false를 반환한다', () => {
      expect(isTargetRegion('41463')).toBe(false);
    });
  });

  describe('getCities', () => {
    it('TARGET_REGIONS의 city를 선언 순서대로 중복 없이 반환한다', () => {
      expect(getCities()).toEqual(['화성시', '수원시', '서울특별시', '성남시', '용인시', '하남시']);
    });
  });

  describe('getLawdCdsByCity', () => {
    it('city에 속한 lawdCd 목록을 반환한다(성남시는 3개 구)', () => {
      expect(getLawdCdsByCity('성남시').sort()).toEqual(['41131', '41133', '41135'].sort());
    });

    it('존재하지 않는 city면 빈 배열을 반환한다', () => {
      expect(getLawdCdsByCity('존재하지않는시')).toEqual([]);
    });
  });
});
