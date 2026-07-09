jest.mock('../../src/repositories/comparison-sets.repository');
jest.mock('../../src/services/apartment-complexes.service');
jest.mock('../../src/services/listings.service');

const comparisonSetsRepository = require('../../src/repositories/comparison-sets.repository');
const apartmentComplexesService = require('../../src/services/apartment-complexes.service');
const listingsService = require('../../src/services/listings.service');
const comparisonService = require('../../src/services/comparison.service');

describe('comparison.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getComparisonSetDetail', () => {
    it('repository가 set을 찾지 못하면 null을 반환한다', async () => {
      comparisonSetsRepository.findSetById.mockResolvedValue(null);

      const result = await comparisonService.getComparisonSetDetail(999);

      expect(result).toBeNull();
    });

    it('target_type이 complex이면 complexes 배열이 채워지고 listings는 null이다', async () => {
      comparisonSetsRepository.findSetById.mockResolvedValue({
        id: 1,
        user_profile_id: 1,
        target_type: 'complex',
        created_at: '2026-01-01'
      });
      comparisonSetsRepository.findComplexIdsBySetId.mockResolvedValue([10, 20]);
      apartmentComplexesService.getComplexDetail.mockImplementation((id) =>
        Promise.resolve({
          id,
          complexName: `단지${id}`,
          completionYear: 2000,
          remodelingStatus: '해당없음',
          reconstructionStatus: '해당없음',
          nearbyRedevelopmentInfo: null,
          localityAttributes: {},
          shuttleCommuteMinutes: 10,
          priceRange: '매물 없음'
        })
      );

      const result = await comparisonService.getComparisonSetDetail(1);

      expect(result.complexes).toHaveLength(2);
      expect(result.complexes[0]).toMatchObject({ complexId: 10, complexName: '단지10' });
      expect(result.complexes[1]).toMatchObject({ complexId: 20, complexName: '단지20' });
      expect(result.listings).toBeNull();
    });

    it('target_type이 listing이면 listings가 채워지고 complexes는 null이다', async () => {
      comparisonSetsRepository.findSetById.mockResolvedValue({
        id: 2,
        user_profile_id: 1,
        target_type: 'listing',
        created_at: '2026-01-01'
      });
      comparisonSetsRepository.findListingIdsBySetId.mockResolvedValue([100]);
      listingsService.getListingDetail.mockResolvedValue({
        id: 100,
        complexId: 5,
        salePrice: 90000,
        exclusiveArea: 84.98
      });
      apartmentComplexesService.getComplexDetail.mockResolvedValue({
        id: 5,
        complexName: '동탄역 시범 우남퍼스트빌',
        completionYear: 1998,
        remodelingStatus: '해당없음',
        reconstructionStatus: '해당없음',
        nearbyRedevelopmentInfo: null,
        localityAttributes: {},
        shuttleCommuteMinutes: 42
      });

      const result = await comparisonService.getComparisonSetDetail(2);

      expect(result.listings).toHaveLength(1);
      expect(result.listings[0]).toMatchObject({
        listingId: 100,
        complexId: 5,
        salePrice: 90000,
        complexName: '동탄역 시범 우남퍼스트빌'
      });
      expect(result.complexes).toBeNull();
    });

    it('동일 단지 매물 2개를 비교하면 두 결과 항목의 단지 축이 동일하게 나온다', async () => {
      comparisonSetsRepository.findSetById.mockResolvedValue({
        id: 3,
        user_profile_id: 1,
        target_type: 'listing',
        created_at: '2026-01-01'
      });
      comparisonSetsRepository.findListingIdsBySetId.mockResolvedValue([101, 102]);
      listingsService.getListingDetail.mockImplementation((id) =>
        Promise.resolve({
          id,
          complexId: 5,
          salePrice: id === 101 ? 95000 : 110000,
          exclusiveArea: id === 101 ? 84.98 : 101.23
        })
      );
      apartmentComplexesService.getComplexDetail.mockResolvedValue({
        id: 5,
        complexName: '동탄역 시범 우남퍼스트빌',
        completionYear: 1998,
        remodelingStatus: '해당없음',
        reconstructionStatus: '해당없음',
        nearbyRedevelopmentInfo: null,
        localityAttributes: { transportation: '지하철 SRT 동탄역 도보 10분' },
        shuttleCommuteMinutes: 42
      });

      const result = await comparisonService.getComparisonSetDetail(3);

      expect(result.listings).toHaveLength(2);
      const [first, second] = result.listings;
      expect(first.complexName).toBe(second.complexName);
      expect(first.completionYear).toBe(second.completionYear);
      expect(first.remodelingStatus).toBe(second.remodelingStatus);
      expect(first.reconstructionStatus).toBe(second.reconstructionStatus);
      expect(first.localityAttributes).toEqual(second.localityAttributes);
      expect(first.shuttleCommuteMinutes).toBe(second.shuttleCommuteMinutes);
    });
  });
});
