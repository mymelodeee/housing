jest.mock('../../src/repositories/store-info-api.repository');

const storeInfoApiRepository = require('../../src/repositories/store-info-api.repository');
const {
  extractTotalCount,
  countAcademiesWithin1km,
  ACADEMY_INDUSTRY_CODES,
  RADIUS_METERS
} = require('../../src/services/academy.service');

describe('services/academy.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('학원 소분류코드 8종을 조회 대상으로 사용한다', () => {
    expect(ACADEMY_INDUSTRY_CODES).toEqual([
      'P10501',
      'P10611',
      'P10615',
      'P10603',
      'P10609',
      'P10617',
      'P10627',
      'P10601'
    ]);
  });

  describe('extractTotalCount', () => {
    it('resultCode가 00이면 body.totalCount를 반환한다', () => {
      expect(extractTotalCount({ header: { resultCode: '00' }, body: { totalCount: 42 } })).toBe(42);
    });

    it('resultCode가 00이 아니면 0을 반환한다', () => {
      expect(extractTotalCount({ header: { resultCode: '03' }, body: {} })).toBe(0);
    });

    it('totalCount가 없으면 0을 반환한다', () => {
      expect(extractTotalCount({ header: { resultCode: '00' }, body: {} })).toBe(0);
    });
  });

  describe('countAcademiesWithin1km', () => {
    it('업종코드별 totalCount를 합산해 반환한다', async () => {
      storeInfoApiRepository.fetchStoresInRadius.mockImplementation(({ indsSclsCd }) =>
        Promise.resolve({
          header: { resultCode: '00' },
          body: { totalCount: indsSclsCd === 'P10501' ? 10 : 1 }
        })
      );

      const result = await countAcademiesWithin1km(37.32, 127.06);

      expect(result).toBe(10 + 1 * (ACADEMY_INDUSTRY_CODES.length - 1));
      expect(storeInfoApiRepository.fetchStoresInRadius).toHaveBeenCalledWith(
        expect.objectContaining({ cx: 127.06, cy: 37.32, radius: RADIUS_METERS, numOfRows: 1 })
      );
    });

    it('일부 코드 조회가 실패(resultCode != 00)해도 나머지는 합산한다', async () => {
      storeInfoApiRepository.fetchStoresInRadius.mockImplementation(({ indsSclsCd }) =>
        Promise.resolve(
          indsSclsCd === 'P10501'
            ? { header: { resultCode: '03' }, body: {} }
            : { header: { resultCode: '00' }, body: { totalCount: 2 } }
        )
      );

      const result = await countAcademiesWithin1km(37.32, 127.06);

      expect(result).toBe(2 * (ACADEMY_INDUSTRY_CODES.length - 1));
    });
  });
});
