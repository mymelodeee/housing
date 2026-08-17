jest.mock('../../src/repositories/molit-api.repository');

const molitApiRepository = require('../../src/repositories/molit-api.repository');
const {
  DATA_SOURCE,
  mapRentItem,
  isJeonse,
  fetchJeonseTransactionsForComplex,
  buildJeonseRatioEntries
} = require('../../src/services/jeonse-history.service');

describe('services/jeonse-history.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mapRentItem', () => {
    it('전월세 항목을 aptName/transactionDate/deposit/monthlyRent로 매핑한다', () => {
      const result = mapRentItem({
        aptNm: '수지단지',
        dealYear: '2026',
        dealMonth: '7',
        dealDay: '3',
        deposit: '55,000',
        monthlyRent: '0'
      });

      expect(result).toEqual({
        aptName: '수지단지',
        transactionDate: '2026-07-03',
        deposit: 55000,
        monthlyRent: 0
      });
    });

    it('deposit이 파싱 불가하면 null로 매핑한다', () => {
      const result = mapRentItem({ aptNm: 'A', dealYear: '2026', dealMonth: '7', dealDay: '3', deposit: '' });
      expect(result.deposit).toBeNull();
    });
  });

  describe('isJeonse', () => {
    it('월세가 0이거나 없으면 전세로 판정한다', () => {
      expect(isJeonse({ deposit: 50000, monthlyRent: 0 })).toBe(true);
      expect(isJeonse({ deposit: 50000, monthlyRent: null })).toBe(true);
    });

    it('월세가 있거나 보증금이 없으면 전세가 아니다', () => {
      expect(isJeonse({ deposit: 20000, monthlyRent: 120 })).toBe(false);
      expect(isJeonse({ deposit: null, monthlyRent: 0 })).toBe(false);
    });
  });

  describe('fetchJeonseTransactionsForComplex', () => {
    it('36개월치 전월세 API를 호출해 단지명 매칭 + 순수 전세만 날짜 오름차순으로 반환한다', async () => {
      molitApiRepository.fetchAptRentXml.mockResolvedValue(
        `<response>
          <header><resultCode>000</resultCode></header>
          <body><items>
            <item><aptNm>수지단지</aptNm><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>3</dealDay><deposit>55,000</deposit><monthlyRent>0</monthlyRent></item>
            <item><aptNm>수지단지</aptNm><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>1</dealDay><deposit>20,000</deposit><monthlyRent>120</monthlyRent></item>
            <item><aptNm>다른단지</aptNm><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>2</dealDay><deposit>50,000</deposit><monthlyRent>0</monthlyRent></item>
          </items></body>
        </response>`
      );

      const result = await fetchJeonseTransactionsForComplex({
        lawdCd: '41465',
        aptName: '수지단지',
        now: new Date(2026, 7, 17)
      });

      expect(molitApiRepository.fetchAptRentXml).toHaveBeenCalledTimes(36);
      expect(result.length).toBe(36);
      expect(result[0]).toEqual({ transactionDate: '2026-07-03', deposit: 55000, dataSource: DATA_SOURCE });
    });

    it('API 오류 응답(월별 reject 포함)은 빈 결과로 처리한다', async () => {
      molitApiRepository.fetchAptRentXml.mockRejectedValue(new Error('network'));

      const result = await fetchJeonseTransactionsForComplex({ lawdCd: '41465', aptName: '수지단지' });

      expect(result).toEqual([]);
    });
  });

  describe('buildJeonseRatioEntries', () => {
    it('월별 평균 전세가/매매가로 전세가율(%)을 계산하고 두 값이 모두 있는 월만 포함한다', () => {
      const saleEntries = [
        { transactionDate: '2026-06-10', transactionPrice: 100000 },
        { transactionDate: '2026-06-20', transactionPrice: 110000 },
        { transactionDate: '2026-07-05', transactionPrice: 120000 }
      ];
      const jeonseEntries = [
        { transactionDate: '2026-06-15', deposit: 63000 },
        { transactionDate: '2026-05-01', deposit: 50000 }
      ];

      const result = buildJeonseRatioEntries({ saleEntries, jeonseEntries });

      expect(result).toEqual([{ month: '2026-06', jeonseRatioPercent: 60 }]);
    });

    it('전세 또는 매매 데이터가 없으면 빈 배열을 반환한다', () => {
      expect(buildJeonseRatioEntries({ saleEntries: [], jeonseEntries: [] })).toEqual([]);
    });
  });
});
