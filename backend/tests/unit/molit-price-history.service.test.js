jest.mock('../../src/repositories/molit-api.repository');

const molitApiRepository = require('../../src/repositories/molit-api.repository');
const {
  generateRecentDealYmds,
  parseAptTradeXml,
  mapTradeItem,
  resolveBuildYear,
  filterByAptName,
  buildMolitPriceHistoryResult,
  fetchPriceHistoryForComplex,
  resolveCompletionYearFromTrades,
  DATA_SOURCE,
} = require('../../src/services/molit-price-history.service');

describe('services/molit-price-history.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRecentDealYmds', () => {
    it('now 기준 최근 36개월(과거→현재 순)의 YYYYMM 문자열 배열을 생성한다', () => {
      const now = new Date('2026-07-10T00:00:00Z');

      const result = generateRecentDealYmds(36, now);

      expect(result).toHaveLength(36);
      expect(result[0]).toBe('202308');
      expect(result[result.length - 1]).toBe('202607');
    });

    it('연도가 바뀌는 경계에서도 YYYYMM이 올바르게 계산된다', () => {
      const now = new Date('2026-01-15T00:00:00Z');

      const result = generateRecentDealYmds(3, now);

      expect(result).toEqual(['202511', '202512', '202601']);
    });
  });

  describe('parseAptTradeXml', () => {
    it('resultCode가 00이고 item이 여러 건이면 배열로 반환한다', () => {
      const xml = `
        <response>
          <header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header>
          <body>
            <items>
              <item><aptNm>동탄역시범우남퍼스트빌</aptNm><dealAmount>95,000</dealAmount><dealYear>2024</dealYear><dealMonth>1</dealMonth><dealDay>15</dealDay></item>
              <item><aptNm>동탄역시범우남퍼스트빌</aptNm><dealAmount>100,000</dealAmount><dealYear>2024</dealYear><dealMonth>3</dealMonth><dealDay>2</dealDay></item>
            </items>
          </body>
        </response>
      `;

      const result = parseAptTradeXml(xml);

      expect(result).toHaveLength(2);
      expect(result[0].aptNm).toBe('동탄역시범우남퍼스트빌');
    });

    it('item이 단건이면 배열로 감싸서 반환한다', () => {
      const xml = `
        <response>
          <header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header>
          <body>
            <items>
              <item><aptNm>동탄역시범우남퍼스트빌</aptNm><dealAmount>95,000</dealAmount><dealYear>2024</dealYear><dealMonth>1</dealMonth><dealDay>15</dealDay></item>
            </items>
          </body>
        </response>
      `;

      const result = parseAptTradeXml(xml);

      expect(result).toHaveLength(1);
    });

    it('items가 비어있으면 빈 배열을 반환한다', () => {
      const xml = `
        <response>
          <header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header>
          <body>
            <items></items>
          </body>
        </response>
      `;

      expect(parseAptTradeXml(xml)).toEqual([]);
    });

    it('resultCode가 00이 아니면(에러 응답) 빈 배열을 반환한다', () => {
      const xml = `
        <response>
          <header><resultCode>03</resultCode><resultMsg>NODATA_ERROR</resultMsg></header>
          <body></body>
        </response>
      `;

      expect(parseAptTradeXml(xml)).toEqual([]);
    });
  });

  describe('mapTradeItem', () => {
    it('dealAmount의 쉼표를 제거하고 정수로 변환하며 거래일자를 YYYY-MM-DD로 조합한다', () => {
      const item = {
        aptNm: '동탄역시범우남퍼스트빌',
        dealAmount: '95,000',
        dealYear: '2024',
        dealMonth: '1',
        dealDay: '5',
      };

      expect(mapTradeItem(item)).toEqual({
        aptName: '동탄역시범우남퍼스트빌',
        transactionDate: '2024-01-05',
        transactionPrice: 95000,
      });
    });

    it('dealAmount 앞뒤 공백이 있어도 정상 파싱한다', () => {
      const item = {
        aptNm: '힐스테이트고덕센트럴',
        dealAmount: '  120,500 ',
        dealYear: '2025',
        dealMonth: '11',
        dealDay: '20',
      };

      expect(mapTradeItem(item)).toEqual({
        aptName: '힐스테이트고덕센트럴',
        transactionDate: '2025-11-20',
        transactionPrice: 120500,
      });
    });
  });

  describe('mapTradeItem - buildYear', () => {
    it('buildYear가 응답에 있으면 정수로 변환해 포함한다', () => {
      const item = {
        aptNm: '동탄역시범우남퍼스트빌',
        dealAmount: '95,000',
        dealYear: '2024',
        dealMonth: '1',
        dealDay: '5',
        buildYear: '2015',
      };

      expect(mapTradeItem(item).buildYear).toBe(2015);
    });

    it('buildYear가 없으면 undefined로 둔다', () => {
      const item = {
        aptNm: '동탄역시범우남퍼스트빌',
        dealAmount: '95,000',
        dealYear: '2024',
        dealMonth: '1',
        dealDay: '5',
      };

      expect(mapTradeItem(item).buildYear).toBeUndefined();
    });
  });

  describe('resolveBuildYear', () => {
    it('가장 많이 등장한 buildYear를 반환한다', () => {
      const transactions = [{ buildYear: 2015 }, { buildYear: 2015 }, { buildYear: 2016 }];

      expect(resolveBuildYear(transactions)).toBe(2015);
    });

    it('buildYear가 전혀 없으면 null을 반환한다', () => {
      expect(resolveBuildYear([{ buildYear: undefined }, {}])).toBeNull();
    });
  });

  describe('filterByAptName', () => {
    const transactions = [
      { aptName: '동탄역시범우남퍼스트빌', transactionDate: '2024-01-05', transactionPrice: 95000 },
      { aptName: '동탄역 시범 우남퍼스트빌', transactionDate: '2024-02-05', transactionPrice: 96000 },
      { aptName: '힐스테이트구성', transactionDate: '2024-03-05', transactionPrice: 80000 },
    ];

    it('공백을 제거한 뒤 정확히 일치하는 거래만 필터링한다', () => {
      const result = filterByAptName(transactions, '동탄역시범우남퍼스트빌');

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.transactionPrice)).toEqual([95000, 96000]);
    });

    it('일치하는 단지명이 없으면 빈 배열을 반환한다', () => {
      expect(filterByAptName(transactions, '없는단지')).toEqual([]);
    });
  });

  describe('buildMolitPriceHistoryResult', () => {
    const NOW = new Date('2026-07-10T00:00:00Z');

    it('transactions가 빈 배열이면 "실거래 이력 없음"을 반환한다', () => {
      const result = buildMolitPriceHistoryResult({ transactions: [], now: NOW });

      expect(result).toEqual({ lookupPeriodType: '실거래 이력 없음', firstTransactionMonth: null, entries: [] });
    });

    it('최초거래가 조회 범위(3년) 시작 시점보다 이전이거나 같으면(윈도우 경계) "최근 3년" 분기를 탄다', () => {
      const transactions = [
        { aptName: 'A', transactionDate: '2023-07-10', transactionPrice: 80000 },
        { aptName: 'A', transactionDate: '2025-01-01', transactionPrice: 90000 },
      ];

      const result = buildMolitPriceHistoryResult({ transactions, now: NOW });

      expect(result.lookupPeriodType).toBe('최근 3년');
      expect(result.firstTransactionMonth).toBeNull();
      expect(result.entries).toEqual([
        { transactionDate: '2023-07-10', transactionPrice: 80000, dataSource: DATA_SOURCE },
        { transactionDate: '2025-01-01', transactionPrice: 90000, dataSource: DATA_SOURCE },
      ]);
    });

    it('최초거래가 3년 창 내부(더 최근)이면 "최초거래 이후"로 firstTransactionMonth와 함께 반환한다', () => {
      const transactions = [
        { aptName: 'A', transactionDate: '2025-06-01', transactionPrice: 100000 },
        { aptName: 'A', transactionDate: '2026-02-14', transactionPrice: 105000 },
      ];

      const result = buildMolitPriceHistoryResult({ transactions, now: NOW });

      expect(result.lookupPeriodType).toBe('최초거래 이후');
      expect(result.firstTransactionMonth).toBe('2025-06');
      expect(result.entries).toEqual([
        { transactionDate: '2025-06-01', transactionPrice: 100000, dataSource: DATA_SOURCE },
        { transactionDate: '2026-02-14', transactionPrice: 105000, dataSource: DATA_SOURCE },
      ]);
    });

    it('입력 순서가 뒤섞여 있어도 transactionDate 오름차순으로 정렬해 반환한다', () => {
      const transactions = [
        { aptName: 'A', transactionDate: '2026-02-14', transactionPrice: 105000 },
        { aptName: 'A', transactionDate: '2025-06-01', transactionPrice: 100000 },
      ];

      const result = buildMolitPriceHistoryResult({ transactions, now: NOW });

      expect(result.entries.map((e) => e.transactionDate)).toEqual(['2025-06-01', '2026-02-14']);
    });
  });

  describe('fetchPriceHistoryForComplex', () => {
    it('36개월 각각에 대해 repository를 호출하고, 성공한 월의 결과만 파싱·필터링해 결과를 조합한다', async () => {
      molitApiRepository.fetchAptTradeXml.mockResolvedValue(`
        <response>
          <header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header>
          <body>
            <items>
              <item><aptNm>동탄역시범우남퍼스트빌</aptNm><dealAmount>95,000</dealAmount><dealYear>2026</dealYear><dealMonth>6</dealMonth><dealDay>1</dealDay></item>
            </items>
          </body>
        </response>
      `);

      const result = await fetchPriceHistoryForComplex({
        lawdCd: '41590',
        aptName: '동탄역시범우남퍼스트빌',
        now: new Date('2026-07-10T00:00:00Z'),
      });

      expect(molitApiRepository.fetchAptTradeXml).toHaveBeenCalledTimes(36);
      expect(result.entries.length).toBeGreaterThan(0);
      expect(result.entries.every((entry) => entry.dataSource === DATA_SOURCE)).toBe(true);
    });

    it('일부 월의 호출이 실패(reject)해도 나머지 월의 결과로 정상 조합된다', async () => {
      molitApiRepository.fetchAptTradeXml
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue(`
          <response>
            <header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header>
            <body>
              <items>
                <item><aptNm>동탄역시범우남퍼스트빌</aptNm><dealAmount>95,000</dealAmount><dealYear>2026</dealYear><dealMonth>6</dealMonth><dealDay>1</dealDay></item>
              </items>
            </body>
          </response>
        `);

      const result = await fetchPriceHistoryForComplex({
        lawdCd: '41590',
        aptName: '동탄역시범우남퍼스트빌',
        now: new Date('2026-07-10T00:00:00Z'),
      });

      expect(result.entries.length).toBeGreaterThan(0);
    });

    it('필터링 결과가 없으면 "실거래 이력 없음"을 반환한다', async () => {
      molitApiRepository.fetchAptTradeXml.mockResolvedValue(`
        <response>
          <header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header>
          <body>
            <items>
              <item><aptNm>다른단지</aptNm><dealAmount>95,000</dealAmount><dealYear>2026</dealYear><dealMonth>6</dealMonth><dealDay>1</dealDay></item>
            </items>
          </body>
        </response>
      `);

      const result = await fetchPriceHistoryForComplex({
        lawdCd: '41590',
        aptName: '동탄역시범우남퍼스트빌',
        now: new Date('2026-07-10T00:00:00Z'),
      });

      expect(result).toEqual({ lookupPeriodType: '실거래 이력 없음', firstTransactionMonth: null, entries: [] });
    });

    it('모든 월의 API 호출이 실패(reject)해서 매칭 결과가 0건이면 "실거래 이력 없음" 대신 "확인 필요"를 반환한다', async () => {
      molitApiRepository.fetchAptTradeXml.mockRejectedValue(new Error('LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND_EXCEEDS_ERROR'));

      const result = await fetchPriceHistoryForComplex({
        lawdCd: '41590',
        aptName: '동탄역시범우남퍼스트빌',
        now: new Date('2026-07-10T00:00:00Z'),
      });

      expect(result).toEqual({ lookupPeriodType: '확인 필요', firstTransactionMonth: null, entries: [], hasApiError: true });
    });

    it('API가 rate-limit 에러 코드를 200 응답으로 반환(reject 아님)해도 실패로 집계해 "확인 필요"를 반환한다', async () => {
      molitApiRepository.fetchAptTradeXml.mockResolvedValue(`
        <response>
          <header><resultCode>22</resultCode><resultMsg>LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND_EXCEEDS_ERROR</resultMsg></header>
          <body></body>
        </response>
      `);

      const result = await fetchPriceHistoryForComplex({
        lawdCd: '41590',
        aptName: '동탄역시범우남퍼스트빌',
        now: new Date('2026-07-10T00:00:00Z'),
      });

      expect(result).toEqual({ lookupPeriodType: '확인 필요', firstTransactionMonth: null, entries: [], hasApiError: true });
    });
  });

  describe('resolveCompletionYearFromTrades', () => {
    it('매칭된 거래들의 buildYear 중 최빈값을 준공년도로 반환한다', async () => {
      molitApiRepository.fetchAptTradeXml.mockResolvedValue(`
        <response>
          <header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header>
          <body>
            <items>
              <item><aptNm>동탄역시범우남퍼스트빌</aptNm><dealAmount>95,000</dealAmount><dealYear>2024</dealYear><dealMonth>1</dealMonth><dealDay>5</dealDay><buildYear>2015</buildYear></item>
              <item><aptNm>동탄역시범우남퍼스트빌</aptNm><dealAmount>96,000</dealAmount><dealYear>2024</dealYear><dealMonth>2</dealMonth><dealDay>5</dealDay><buildYear>2015</buildYear></item>
            </items>
          </body>
        </response>
      `);

      const result = await resolveCompletionYearFromTrades({
        lawdCd: '41590',
        aptName: '동탄역시범우남퍼스트빌',
        now: new Date('2026-07-10T00:00:00Z'),
      });

      expect(result.completionYear).toBe(2015);
      expect(result.sampleSize).toBeGreaterThan(0);
      expect(result.hasApiError).toBe(false);
    });

    it('매칭된 거래가 없으면 completionYear는 null이다', async () => {
      molitApiRepository.fetchAptTradeXml.mockResolvedValue(`
        <response>
          <header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header>
          <body><items></items></body>
        </response>
      `);

      const result = await resolveCompletionYearFromTrades({
        lawdCd: '41590',
        aptName: '동탄역시범우남퍼스트빌',
        now: new Date('2026-07-10T00:00:00Z'),
      });

      expect(result.completionYear).toBeNull();
    });
  });
});
