jest.mock('../../src/repositories/store-info-api.repository');

const storeInfoApiRepository = require('../../src/repositories/store-info-api.repository');
const {
  hasVenueInResponse,
  hasEntertainmentVenueWithin700m,
  ENTERTAINMENT_INDUSTRY_CODES,
} = require('../../src/services/entertainment-venue.service');

describe('services/entertainment-venue.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('hasVenueInResponse', () => {
    it('resultCode가 00이고 items가 존재하면 true를 반환한다', () => {
      const json = { header: { resultCode: '00' }, body: { items: [{ bizesId: '1' }] } };
      expect(hasVenueInResponse(json)).toBe(true);
    });

    it('resultCode가 NODATA_ERROR(03)이면 false를 반환한다', () => {
      const json = { header: { resultCode: '03' }, body: {} };
      expect(hasVenueInResponse(json)).toBe(false);
    });

    it('items가 빈 배열이면 false를 반환한다', () => {
      const json = { header: { resultCode: '00' }, body: { items: [] } };
      expect(hasVenueInResponse(json)).toBe(false);
    });
  });

  it('유흥주점업 표준산업분류코드 4종을 조회 대상으로 사용한다', () => {
    expect(ENTERTAINMENT_INDUSTRY_CODES).toEqual(['I21101', 'I21102', 'I21103', 'I21109']);
  });

  describe('hasEntertainmentVenueWithin700m', () => {
    it('업종 코드 조회 결과 매물이 있으면 true를 반환한다', async () => {
      storeInfoApiRepository.fetchStoresInRadius.mockResolvedValue({
        header: { resultCode: '00' },
        body: { items: [{ bizesId: '1' }] },
      });

      const result = await hasEntertainmentVenueWithin700m(37.2, 127.1);

      expect(result).toBe(true);
      expect(storeInfoApiRepository.fetchStoresInRadius).toHaveBeenCalledWith(
        expect.objectContaining({ cx: 127.1, cy: 37.2, radius: 700, indsSclsCd: ENTERTAINMENT_INDUSTRY_CODES[0] })
      );
    });

    it('모든 업종 코드 조회 결과가 NODATA이면 false를 반환한다', async () => {
      storeInfoApiRepository.fetchStoresInRadius.mockResolvedValue({
        header: { resultCode: '03', resultMsg: 'NODATA_ERROR' },
        body: {},
      });

      const result = await hasEntertainmentVenueWithin700m(37.2, 127.1);

      expect(result).toBe(false);
      expect(storeInfoApiRepository.fetchStoresInRadius).toHaveBeenCalledTimes(ENTERTAINMENT_INDUSTRY_CODES.length);
    });

    it('앞선 업종 코드가 NODATA여도 이후 코드에서 매물이 있으면 true를 반환하고 조회를 중단한다', async () => {
      storeInfoApiRepository.fetchStoresInRadius
        .mockResolvedValueOnce({ header: { resultCode: '03', resultMsg: 'NODATA_ERROR' }, body: {} })
        .mockResolvedValueOnce({ header: { resultCode: '03', resultMsg: 'NODATA_ERROR' }, body: {} })
        .mockResolvedValueOnce({ header: { resultCode: '00' }, body: { items: [{ bizesId: '1' }] } });

      const result = await hasEntertainmentVenueWithin700m(37.2, 127.1);

      expect(result).toBe(true);
      expect(storeInfoApiRepository.fetchStoresInRadius).toHaveBeenCalledTimes(3);
      expect(storeInfoApiRepository.fetchStoresInRadius).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ indsSclsCd: ENTERTAINMENT_INDUSTRY_CODES[2] })
      );
    });
  });
});
