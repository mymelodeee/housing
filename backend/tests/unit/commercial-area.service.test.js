jest.mock('../../src/repositories/store-info-api.repository');

const storeInfoApiRepository = require('../../src/repositories/store-info-api.repository');
const {
  extractTotalCount,
  countByIndustryCodes,
  summarizeCommercialArea,
  RESTAURANT_INDUSTRY_CODES,
  CAFE_INDUSTRY_CODES,
  MART_CONVENIENCE_INDUSTRY_CODES,
  CLINIC_INDUSTRY_CODES
} = require('../../src/services/commercial-area.service');

function successResponse(totalCount) {
  return { header: { resultCode: '00' }, body: { totalCount } };
}

describe('services/commercial-area.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTotalCount', () => {
    it('성공 응답이면 totalCount를 반환한다', () => {
      expect(extractTotalCount(successResponse(5))).toBe(5);
    });

    it('실패 응답(resultCode != 00)이면 0을 반환한다', () => {
      expect(extractTotalCount({ header: { resultCode: '99' }, body: { totalCount: 5 } })).toBe(0);
    });

    it('응답이 비정상이어도 0을 반환한다', () => {
      expect(extractTotalCount(null)).toBe(0);
      expect(extractTotalCount({})).toBe(0);
    });
  });

  describe('countByIndustryCodes', () => {
    it('코드별 조회를 순차 실행해 totalCount를 합산한다', async () => {
      storeInfoApiRepository.fetchStoresInRadius
        .mockResolvedValueOnce(successResponse(3))
        .mockResolvedValueOnce(successResponse(2));

      const total = await countByIndustryCodes(37.2, 127.1, ['A1', 'A2']);

      expect(total).toBe(5);
      expect(storeInfoApiRepository.fetchStoresInRadius).toHaveBeenCalledTimes(2);
      expect(storeInfoApiRepository.fetchStoresInRadius).toHaveBeenCalledWith(
        expect.objectContaining({ cx: 127.1, cy: 37.2, indsSclsCd: 'A1', numOfRows: 1 })
      );
    });
  });

  describe('summarizeCommercialArea', () => {
    it('4개 카테고리 각각의 합산 건수를 요약 문자열로 반환한다', async () => {
      storeInfoApiRepository.fetchStoresInRadius.mockImplementation(({ indsSclsCd }) => {
        if (RESTAURANT_INDUSTRY_CODES.includes(indsSclsCd)) return Promise.resolve(successResponse(1));
        if (CAFE_INDUSTRY_CODES.includes(indsSclsCd)) return Promise.resolve(successResponse(2));
        if (MART_CONVENIENCE_INDUSTRY_CODES.includes(indsSclsCd)) return Promise.resolve(successResponse(1));
        if (CLINIC_INDUSTRY_CODES.includes(indsSclsCd)) return Promise.resolve(successResponse(1));
        return Promise.resolve(successResponse(0));
      });

      const result = await summarizeCommercialArea(37.2, 127.1);

      expect(result).toBe(
        `음식점 ${RESTAURANT_INDUSTRY_CODES.length} · 카페 2 · 마트/편의점 ${MART_CONVENIENCE_INDUSTRY_CODES.length} · 병원 ${CLINIC_INDUSTRY_CODES.length} (700m 이내)`
      );
    });
  });
});
