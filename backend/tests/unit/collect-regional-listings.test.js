jest.mock('../../src/services/apt-list.service');
jest.mock('../../src/repositories/molit-api.repository');
jest.mock('../../src/services/geocoding.service');
jest.mock('../../src/repositories/regional-listing-cache.repository');

const aptListService = require('../../src/services/apt-list.service');
const molitApiRepository = require('../../src/repositories/molit-api.repository');
const geocodingService = require('../../src/services/geocoding.service');
const regionalListingCacheRepository = require('../../src/repositories/regional-listing-cache.repository');
const {
  mapTradeItemWithArea,
  buildAddressFromTransaction,
  fetchTransactionsForRegion,
  selectLatestPerComplexAndArea,
  filterTransactionsByDongs,
  matchAptListEntry,
  resolveCoordinatesForComplex,
  collectRegion
} = require('../../scripts/collect-regional-listings');

describe('scripts/collect-regional-listings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mapTradeItemWithArea', () => {
    it('국토부 실거래가 항목을 aptName/transactionDate/transactionPrice/exclusiveArea로 매핑한다', () => {
      const result = mapTradeItemWithArea({
        aptNm: '동탄역 시범 우남퍼스트빌',
        dealYear: '2026',
        dealMonth: '6',
        dealDay: '1',
        dealAmount: '95,000',
        excluUseAr: '84.98',
        umdNm: '청계동',
        jibun: '123'
      });

      expect(result).toEqual({
        aptName: '동탄역 시범 우남퍼스트빌',
        transactionDate: '2026-06-01',
        transactionPrice: 95000,
        exclusiveArea: 84.98,
        dong: '청계동',
        jibun: '123'
      });
    });
  });

  describe('buildAddressFromTransaction', () => {
    it('dong/jibun이 모두 있으면 지역명+동+지번 주소를 구성한다', () => {
      const address = buildAddressFromTransaction('화성', { dong: '청계동', jibun: '123' });
      expect(address).toBe('화성 청계동 123');
    });

    it('dong 또는 jibun이 없으면 null을 반환한다', () => {
      expect(buildAddressFromTransaction('화성', { dong: null, jibun: '123' })).toBeNull();
      expect(buildAddressFromTransaction('화성', { dong: '청계동', jibun: null })).toBeNull();
    });
  });

  describe('filterTransactionsByDongs', () => {
    const transactions = [
      { aptName: 'A', dong: '장지동' },
      { aptName: 'B', dong: '문정동' },
      { aptName: 'C', dong: '거여동' }
    ];

    it('dongs가 지정되면 해당 법정동의 거래만 남긴다', () => {
      const result = filterTransactionsByDongs(transactions, ['장지동', '거여동']);
      expect(result.map((t) => t.aptName)).toEqual(['A', 'C']);
    });

    it('dongs가 없거나 빈 배열이면 전체를 그대로 반환한다', () => {
      expect(filterTransactionsByDongs(transactions, undefined)).toEqual(transactions);
      expect(filterTransactionsByDongs(transactions, [])).toEqual(transactions);
    });
  });

  describe('fetchTransactionsForRegion', () => {
    it('molit API를 최근 3개월치 호출해 파싱된 거래 목록을 반환한다', async () => {
      molitApiRepository.fetchAptTradeXml.mockResolvedValue(
        `<response>
          <header><resultCode>00</resultCode></header>
          <body><items><item>
            <aptNm>동탄역 시범 우남퍼스트빌</aptNm>
            <dealYear>2026</dealYear><dealMonth>6</dealMonth><dealDay>1</dealDay>
            <dealAmount>95,000</dealAmount><excluUseAr>84.98</excluUseAr>
            <umdNm>청계동</umdNm><jibun>123</jibun>
          </item></items></body>
        </response>`
      );

      const result = await fetchTransactionsForRegion('41590');

      expect(molitApiRepository.fetchAptTradeXml).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ aptName: '동탄역 시범 우남퍼스트빌', exclusiveArea: 84.98 });
    });

    it('일부 호출이 실패해도 나머지 결과만 반환한다', async () => {
      molitApiRepository.fetchAptTradeXml
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValue('<response><header><resultCode>00</resultCode></header><body></body></response>');

      const result = await fetchTransactionsForRegion('41590');

      expect(result).toEqual([]);
    });
  });

  describe('selectLatestPerComplexAndArea', () => {
    it('같은 단지+평형 조합 중 가장 최근 거래일자 1건만 남긴다', () => {
      const transactions = [
        { aptName: '동탄역 시범 우남퍼스트빌', exclusiveArea: 84.98, transactionDate: '2026-01-01' },
        { aptName: '동탄역 시범 우남퍼스트빌', exclusiveArea: 84.98, transactionDate: '2026-06-01' },
        { aptName: '동탄역 시범 우남퍼스트빌', exclusiveArea: 59.87, transactionDate: '2026-03-01' }
      ];

      const result = selectLatestPerComplexAndArea(transactions);

      expect(result).toHaveLength(2);
      const match84 = result.find((t) => t.exclusiveArea === 84.98);
      expect(match84.transactionDate).toBe('2026-06-01');
    });

    it('exclusiveArea가 없는 거래는 제외한다', () => {
      const transactions = [
        { aptName: '단지A', exclusiveArea: undefined, transactionDate: '2026-01-01' },
        { aptName: '단지A', exclusiveArea: NaN, transactionDate: '2026-02-01' }
      ];

      expect(selectLatestPerComplexAndArea(transactions)).toEqual([]);
    });
  });

  describe('matchAptListEntry', () => {
    it('공백 제거 후 이름이 일치하는 항목을 찾는다', () => {
      const aptList = [{ kaptCode: 'A1', kaptName: '동탄역 시범 우남퍼스트빌' }];
      const result = matchAptListEntry('동탄역시범우남퍼스트빌', aptList);
      expect(result).toEqual(aptList[0]);
    });

    it('일치하는 항목이 없으면 undefined를 반환한다', () => {
      const aptList = [{ kaptCode: 'A1', kaptName: '전혀다른단지' }];
      expect(matchAptListEntry('동탄역 시범 우남퍼스트빌', aptList)).toBeUndefined();
    });
  });

  describe('resolveCoordinatesForComplex', () => {
    it('캐시에 이미 좌표가 있으면 geocoding을 호출하지 않는다', async () => {
      regionalListingCacheRepository.findCoordinatesByComplexName.mockResolvedValue({ latitude: 37.1, longitude: 127.1 });

      const result = await resolveCoordinatesForComplex({
        lawdCd: '41590',
        regionName: '화성',
        complexName: '동탄역 시범 우남퍼스트빌',
        address: null
      });

      expect(geocodingService.geocodeAddress).not.toHaveBeenCalled();
      expect(result).toEqual({ latitude: 37.1, longitude: 127.1 });
    });

    it('캐시에 좌표가 없으면 address 또는 지역명+단지명으로 geocoding을 호출한다', async () => {
      regionalListingCacheRepository.findCoordinatesByComplexName.mockResolvedValue(null);
      geocodingService.geocodeAddress.mockResolvedValue({ latitude: 37.2, longitude: 127.2 });

      await resolveCoordinatesForComplex({
        lawdCd: '41590',
        regionName: '화성',
        complexName: '동탄역 시범 우남퍼스트빌',
        address: null
      });

      expect(geocodingService.geocodeAddress).toHaveBeenCalledWith('화성 동탄역 시범 우남퍼스트빌');
    });
  });

  describe('collectRegion', () => {
    it('단지 목록과 실거래 데이터를 매칭하고 기본정보 API로 세대수를 조회해 캐시에 upsert한다', async () => {
      aptListService.fetchAptListForRegion.mockResolvedValue([
        { kaptCode: 'A1', kaptName: '동탄역 시범 우남퍼스트빌' }
      ]);
      aptListService.fetchHouseholdCount.mockResolvedValue(500);
      molitApiRepository.fetchAptTradeXml.mockResolvedValue(
        `<response>
          <header><resultCode>00</resultCode></header>
          <body><items><item>
            <aptNm>동탄역 시범 우남퍼스트빌</aptNm>
            <dealYear>2026</dealYear><dealMonth>6</dealMonth><dealDay>1</dealDay>
            <dealAmount>95,000</dealAmount><excluUseAr>84.98</excluUseAr>
            <umdNm>청계동</umdNm><jibun>123</jibun>
          </item></items></body>
        </response>`
      );
      regionalListingCacheRepository.findCoordinatesByComplexName.mockResolvedValue(null);
      geocodingService.geocodeAddress.mockResolvedValue({ latitude: 37.1, longitude: 127.1 });
      regionalListingCacheRepository.upsertEntry.mockResolvedValue({ id: 1 });

      const count = await collectRegion({ regionName: '화성', lawdCd: '41590' });

      expect(count).toBe(1);
      expect(regionalListingCacheRepository.upsertEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          lawdCd: '41590',
          kaptCode: 'A1',
          complexName: '동탄역 시범 우남퍼스트빌',
          address: '화성 청계동 123',
          exclusiveArea: 84.98,
          salePrice: 95000,
          transactionDate: '2026-06-01',
          householdCount: 500,
          latitude: 37.1,
          longitude: 127.1
        })
      );
      expect(aptListService.fetchHouseholdCount).toHaveBeenCalledWith('A1');
    });

    it('매칭된 단지가 없으면 세대수 조회 없이 householdCount null로 upsert한다', async () => {
      aptListService.fetchAptListForRegion.mockResolvedValue([]);
      molitApiRepository.fetchAptTradeXml.mockResolvedValue(
        `<response>
          <header><resultCode>00</resultCode></header>
          <body><items><item>
            <aptNm>동탄역 시범 우남퍼스트빌</aptNm>
            <dealYear>2026</dealYear><dealMonth>6</dealMonth><dealDay>1</dealDay>
            <dealAmount>95,000</dealAmount><excluUseAr>84.98</excluUseAr>
            <umdNm>청계동</umdNm><jibun>123</jibun>
          </item></items></body>
        </response>`
      );
      regionalListingCacheRepository.findCoordinatesByComplexName.mockResolvedValue(null);
      geocodingService.geocodeAddress.mockResolvedValue({ latitude: 37.1, longitude: 127.1 });
      regionalListingCacheRepository.upsertEntry.mockResolvedValue({ id: 1 });

      const count = await collectRegion({ regionName: '화성', lawdCd: '41590' });

      expect(count).toBe(1);
      expect(aptListService.fetchHouseholdCount).not.toHaveBeenCalled();
      expect(regionalListingCacheRepository.upsertEntry).toHaveBeenCalledWith(
        expect.objectContaining({ kaptCode: null, householdCount: null })
      );
    });
  });
});
