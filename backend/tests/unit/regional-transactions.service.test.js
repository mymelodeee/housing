jest.mock('../../src/repositories/regional-transaction-cache.repository');
jest.mock('../../src/repositories/apartment-complexes.repository');
jest.mock('../../src/repositories/listings.repository');
jest.mock('../../src/services/geocoding.service');

const { getLawdCdsByCity } = require('../../src/config/target-regions');
const regionalTransactionCacheRepository = require('../../src/repositories/regional-transaction-cache.repository');
const apartmentComplexesRepository = require('../../src/repositories/apartment-complexes.repository');
const listingsRepository = require('../../src/repositories/listings.repository');
const geocodingService = require('../../src/services/geocoding.service');
const {
  searchRecentTransactions,
  selectCacheEntry,
  selectCacheEntryComplex
} = require('../../src/services/regional-transactions.service');

const baseCacheRow = {
  id: 1,
  lawd_cd: '41597',
  kapt_code: 'A1',
  complex_name: '동탄역 시범 우남퍼스트빌',
  address: '경기도 화성시 동탄역로 123',
  exclusive_area: 84.98,
  sale_price: 95000,
  transaction_date: '2026-06-01',
  household_count: 500,
  latitude: 37.1996,
  longitude: 127.0982,
  collected_at: '2026-07-01T00:00:00Z'
};

describe('services/regional-transactions.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchRecentTransactions', () => {
    it('인자 없이 호출 시 기본 가격/면적 범위로 repository를 호출한다', async () => {
      regionalTransactionCacheRepository.findByFilters.mockResolvedValue([]);

      await searchRecentTransactions({});

      expect(regionalTransactionCacheRepository.findByFilters).toHaveBeenCalledWith({
        minPrice: 70000,
        maxPrice: 150000,
        minArea: 0,
        maxArea: 999,
        minHouseholdCount: 500,
        targetLawdCds: expect.any(Array)
      });
    });

    it('repository row를 camelCase 스키마로 매핑해 반환한다', async () => {
      regionalTransactionCacheRepository.findByFilters.mockResolvedValue([baseCacheRow]);

      const result = await searchRecentTransactions({ minPrice: 90000, maxPrice: 100000, minArea: 80, maxArea: 90 });

      expect(regionalTransactionCacheRepository.findByFilters).toHaveBeenCalledWith({
        minPrice: 90000,
        maxPrice: 100000,
        minArea: 80,
        maxArea: 90,
        minHouseholdCount: 500,
        targetLawdCds: expect.any(Array)
      });
      expect(result).toEqual([
        {
          id: 1,
          lawdCd: '41597',
          kaptCode: 'A1',
          complexName: '동탄역 시범 우남퍼스트빌',
          address: '경기도 화성시 동탄역로 123',
          exclusiveArea: 84.98,
          salePrice: 95000,
          transactionDate: '2026-06-01',
          householdCount: 500,
          latitude: 37.1996,
          longitude: 127.0982,
          collectedAt: '2026-07-01T00:00:00Z'
        }
      ]);
    });

    it('city가 지정되면 해당 city의 lawdCd 목록만 targetLawdCds로 repository에 전달된다', async () => {
      regionalTransactionCacheRepository.findByFilters.mockResolvedValue([]);

      await searchRecentTransactions({ city: '용인시' });

      expect(regionalTransactionCacheRepository.findByFilters).toHaveBeenCalledWith(
        expect.objectContaining({ targetLawdCds: getLawdCdsByCity('용인시') })
      );
    });

    it('transaction_date가 Date 객체이면 로컬 기준 YYYY-MM-DD 문자열로 변환한다', async () => {
      regionalTransactionCacheRepository.findByFilters.mockResolvedValue([
        { ...baseCacheRow, transaction_date: new Date(2026, 5, 30) }
      ]);

      const result = await searchRecentTransactions({});

      expect(result[0].transactionDate).toBe('2026-06-30');
    });
  });

  describe('selectCacheEntry', () => {
    it('캐시 항목이 존재하지 않으면 null을 반환한다', async () => {
      regionalTransactionCacheRepository.findById.mockResolvedValue(null);

      const result = await selectCacheEntry(999999);

      expect(result).toBeNull();
    });

    it('sale_price가 서비스 탐색 범위를 벗어나면 422 에러를 던진다', async () => {
      regionalTransactionCacheRepository.findById.mockResolvedValue({ ...baseCacheRow, sale_price: 50000 });

      await expect(selectCacheEntry(1)).rejects.toMatchObject({ status: 422 });
      expect(apartmentComplexesRepository.findByAddress).not.toHaveBeenCalled();
    });

    it('좌표가 이미 캐시에 있으면 geocoding을 호출하지 않고 기존 단지를 찾아 매물을 find-or-create한다', async () => {
      regionalTransactionCacheRepository.findById.mockResolvedValue(baseCacheRow);
      apartmentComplexesRepository.findByAddress.mockResolvedValue({ id: 10 });
      listingsRepository.findByComplexAndArea.mockResolvedValue({ id: 20 });

      const result = await selectCacheEntry(1);

      expect(geocodingService.geocodeAddress).not.toHaveBeenCalled();
      expect(apartmentComplexesRepository.insert).not.toHaveBeenCalled();
      expect(listingsRepository.insert).not.toHaveBeenCalled();
      expect(result).toEqual({ listingId: 20 });
    });

    it('좌표가 없으면 geocoding을 호출해 단지를 새로 생성하고 매물도 새로 생성한다', async () => {
      regionalTransactionCacheRepository.findById.mockResolvedValue({ ...baseCacheRow, latitude: null, longitude: null });
      geocodingService.geocodeAddress.mockResolvedValue({ latitude: 37.1, longitude: 127.1 });
      apartmentComplexesRepository.findByAddress.mockResolvedValue(null);
      apartmentComplexesRepository.insert.mockResolvedValue({ id: 11 });
      listingsRepository.findByComplexAndArea.mockResolvedValue(null);
      listingsRepository.insert.mockResolvedValue({ id: 21 });

      const result = await selectCacheEntry(1);

      expect(geocodingService.geocodeAddress).toHaveBeenCalledWith('경기도 화성시 동탄역로 123');
      expect(apartmentComplexesRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          complexName: '동탄역 시범 우남퍼스트빌',
          latitude: 37.1,
          longitude: 127.1,
          address: '경기도 화성시 동탄역로 123',
          completionYear: null,
          lawdCd: '41597',
          molitAptName: '동탄역 시범 우남퍼스트빌'
        })
      );
      expect(listingsRepository.insert).toHaveBeenCalledWith({
        complexId: 11,
        salePrice: 95000,
        exclusiveArea: 84.98
      });
      expect(result).toEqual({ listingId: 21 });
    });

    it('좌표가 없고 geocoding도 실패하면 422 에러를 던진다', async () => {
      regionalTransactionCacheRepository.findById.mockResolvedValue({ ...baseCacheRow, latitude: null, longitude: null });
      geocodingService.geocodeAddress.mockResolvedValue(null);

      await expect(selectCacheEntry(1)).rejects.toMatchObject({ status: 422 });
      expect(apartmentComplexesRepository.findByAddress).not.toHaveBeenCalled();
    });

    it('address가 없으면 지역명+단지명으로 geocoding 쿼리를 구성한다', async () => {
      regionalTransactionCacheRepository.findById.mockResolvedValue({
        ...baseCacheRow,
        address: null,
        latitude: null,
        longitude: null
      });
      geocodingService.geocodeAddress.mockResolvedValue({ latitude: 37.1, longitude: 127.1 });
      apartmentComplexesRepository.findByAddress.mockResolvedValue(null);
      apartmentComplexesRepository.insert.mockResolvedValue({ id: 12 });
      listingsRepository.findByComplexAndArea.mockResolvedValue(null);
      listingsRepository.insert.mockResolvedValue({ id: 22 });

      await selectCacheEntry(1);

      expect(geocodingService.geocodeAddress).toHaveBeenCalledWith('화성시 동탄구 동탄역 시범 우남퍼스트빌');
    });
  });

  describe('selectCacheEntryComplex', () => {
    it('캐시 항목이 존재하지 않으면 null을 반환한다', async () => {
      regionalTransactionCacheRepository.findById.mockResolvedValue(null);

      const result = await selectCacheEntryComplex(999999);

      expect(result).toBeNull();
    });

    it('sale_price 탐색 범위와 무관하게 단지만 find-or-create하고 listing은 만들지 않는다', async () => {
      regionalTransactionCacheRepository.findById.mockResolvedValue({ ...baseCacheRow, sale_price: 50000 });
      apartmentComplexesRepository.findByAddress.mockResolvedValue({ id: 10 });

      const result = await selectCacheEntryComplex(1);

      expect(listingsRepository.insert).not.toHaveBeenCalled();
      expect(listingsRepository.findByComplexAndArea).not.toHaveBeenCalled();
      expect(result).toEqual({ complexId: 10 });
    });

    it('좌표가 없고 geocoding도 실패하면 422 에러를 던진다', async () => {
      regionalTransactionCacheRepository.findById.mockResolvedValue({ ...baseCacheRow, latitude: null, longitude: null });
      geocodingService.geocodeAddress.mockResolvedValue(null);

      await expect(selectCacheEntryComplex(1)).rejects.toMatchObject({ status: 422 });
    });
  });
});
