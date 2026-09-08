jest.mock('../../src/repositories/elementary-schools.repository');
jest.mock('../../src/db/pool', () => ({ end: jest.fn() }));

const {
  isTargetRegionAddress,
  resolveSchoolLevel,
  fetchSchoolsPage,
  mapToSchool,
  TARGET_SCHOOL_LEVELS
} = require('../../scripts/seed-elementary-schools');

describe('scripts/seed-elementary-schools', () => {
  it('TARGET_SCHOOL_LEVELS는 초/중/고를 모두 포함한다', () => {
    expect(TARGET_SCHOOL_LEVELS).toEqual(['초등학교', '중학교', '고등학교']);
  });

  describe('isTargetRegionAddress', () => {
    it('대상 지역 키워드가 포함된 주소는 true다', () => {
      expect(isTargetRegionAddress('경기도 화성시 동탄역로 123')).toBe(true);
    });

    it('대상 지역 밖 주소는 false다', () => {
      expect(isTargetRegionAddress('경상남도 합천군 묘산면')).toBe(false);
    });

    it('주소가 없으면 false다', () => {
      expect(isTargetRegionAddress(null)).toBe(false);
      expect(isTargetRegionAddress(undefined)).toBe(false);
    });
  });

  describe('resolveSchoolLevel', () => {
    it('schoolSe가 대상 레벨이면 그대로 반환한다', () => {
      expect(resolveSchoolLevel({ schoolSe: '고등학교', schoolNm: 'A고등학교' })).toBe('고등학교');
    });

    it('schoolSe가 대상 레벨이 아니면 학교명에서 추론한다', () => {
      expect(resolveSchoolLevel({ schoolSe: '각종학교', schoolNm: 'A중학교' })).toBe('중학교');
    });

    it('어느 쪽에도 해당하지 않으면 undefined다', () => {
      expect(resolveSchoolLevel({ schoolSe: '특수학교', schoolNm: 'A학교' })).toBeUndefined();
    });
  });

  describe('mapToSchool', () => {
    it('도로명주소를 우선 사용하고 위경도를 숫자로 변환한다', () => {
      const result = mapToSchool(
        { schoolNm: 'A초등학교', rdnmadr: '서울시 강동구 1', lnmadr: '서울시 강동구 2', latitude: '37.5', longitude: '127.1' },
        '초등학교'
      );

      expect(result).toEqual({
        schoolName: 'A초등학교',
        schoolLevel: '초등학교',
        latitude: 37.5,
        longitude: 127.1,
        address: '서울시 강동구 1'
      });
    });

    it('도로명주소가 없으면 지번주소를 사용한다', () => {
      const result = mapToSchool({ schoolNm: 'B중학교', lnmadr: '서울시 송파구 2', latitude: '37.5', longitude: '127.1' }, '중학교');
      expect(result.address).toBe('서울시 송파구 2');
    });
  });

  describe('fetchSchoolsPage', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('실제 API 응답 형태(response 래핑 없이 header/body 최상위)를 올바르게 파싱한다', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
            body: { items: { item: [{ schoolNm: 'A고등학교', schoolSe: '고등학교' }] }, numOfRows: 1000, pageNo: 1, totalCount: 1 }
          })
      });

      const result = await fetchSchoolsPage(1);

      expect(result).toEqual([{ schoolNm: 'A고등학교', schoolSe: '고등학교' }]);
    });

    it('결과가 1건이면 item이 배열이 아닌 객체로 와도 배열로 감싼다', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
            body: { items: { item: { schoolNm: 'A고등학교' } } }
          })
      });

      const result = await fetchSchoolsPage(1);

      expect(result).toEqual([{ schoolNm: 'A고등학교' }]);
    });

    it('resultCode가 00이 아니면 에러를 던진다', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            header: { resultCode: '30', resultMsg: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' }
          })
      });

      await expect(fetchSchoolsPage(1)).rejects.toThrow('SERVICE_KEY_IS_NOT_REGISTERED_ERROR');
    });

    it('items가 없으면 빈 배열을 반환한다', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ header: { resultCode: '00' }, body: {} })
      });

      expect(await fetchSchoolsPage(1)).toEqual([]);
    });
  });
});
