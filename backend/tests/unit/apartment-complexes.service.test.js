jest.mock('../../src/repositories/apartment-complexes.repository');
jest.mock('../../src/services/apartment-complex-price.service');
jest.mock('../../src/services/locality-enrichment.service');

const apartmentComplexesRepository = require('../../src/repositories/apartment-complexes.repository');
const apartmentComplexPriceService = require('../../src/services/apartment-complex-price.service');
const localityEnrichmentService = require('../../src/services/locality-enrichment.service');
const {
  getComplexDetail,
  listComplexSummaries,
} = require('../../src/services/apartment-complexes.service');

const baseRow = {
  id: 1,
  complex_name: '동탄역 시범 우남퍼스트빌',
  address: '경기도 화성시 동탄역로 123',
  completion_year: 1998,
  remodeling_status: '해당없음',
  reconstruction_status: '해당없음',
  is_regulated_area: true,
  is_land_transaction_permission_zone: true,
  nearest_shuttle_stop_name: '동탄역 셔틀정류장',
  nearest_shuttle_stop_distance: 350,
  shuttle_commute_minutes: 42,
  latitude: 37.1996,
  longitude: 127.0982,
  remodeling_completion_year: null,
  nearby_redevelopment_info: null,
  locality_attributes: { 교통: '지하철 SRT 동탄역 도보 10분', 학군: '정보 없음' },
};

describe('services/apartment-complexes.service', () => {
  beforeEach(() => {
    localityEnrichmentService.enrichLocalityAttributes.mockImplementation(
      async (baseAttributes) => baseAttributes
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getComplexDetail', () => {
    it('repository가 null을 반환하면 서비스도 null을 반환하고 price 서비스는 호출되지 않는다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(null);

      const result = await getComplexDetail(999999);

      expect(result).toBeNull();
      expect(apartmentComplexPriceService.getComplexPriceRange).not.toHaveBeenCalled();
    });

    it('is_land_transaction_permission_zone이 null이면 "확인필요"로 매핑된다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue({
        ...baseRow,
        is_land_transaction_permission_zone: null,
      });
      apartmentComplexPriceService.getComplexPriceRange.mockResolvedValue('매물 없음');

      const result = await getComplexDetail(2);

      expect(result.isLandTransactionPermissionZone).toBe('확인필요');
    });

    it('is_land_transaction_permission_zone이 true이면 그대로 true를 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue({
        ...baseRow,
        is_land_transaction_permission_zone: true,
      });
      apartmentComplexPriceService.getComplexPriceRange.mockResolvedValue('매물 없음');

      const result = await getComplexDetail(1);

      expect(result.isLandTransactionPermissionZone).toBe(true);
    });

    it('셔틀 필드가 전부 null인 row는 결과에서도 null로 유지된다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue({
        ...baseRow,
        nearest_shuttle_stop_name: null,
        nearest_shuttle_stop_distance: null,
        shuttle_commute_minutes: null,
      });
      apartmentComplexPriceService.getComplexPriceRange.mockResolvedValue('매물 없음');

      const result = await getComplexDetail(2);

      expect(result.nearestShuttleStopName).toBeNull();
      expect(result.nearestShuttleStopDistance).toBeNull();
      expect(result.shuttleCommuteMinutes).toBeNull();
    });

    it('locality_attributes에 일부 키만 있으면 나머지는 "정보 없음"으로 채워진다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue({
        ...baseRow,
        locality_attributes: { 교통: '지하철 도보 5분' },
      });
      apartmentComplexPriceService.getComplexPriceRange.mockResolvedValue('매물 없음');

      const result = await getComplexDetail(1);

      expect(result.localityAttributes).toEqual({
        transportation: '지하철 도보 5분',
        commercialArea: '정보 없음',
        schoolDistrict: '정보 없음',
        gangnamAccessibility: '정보 없음',
        entertainmentAndParks: '정보 없음',
        developmentProspects: '정보 없음',
        nearbyJobs: '정보 없음',
      });
    });

    it('locality_attributes가 null이면 7개 전부 "정보 없음"이다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue({
        ...baseRow,
        locality_attributes: null,
      });
      apartmentComplexPriceService.getComplexPriceRange.mockResolvedValue('매물 없음');

      const result = await getComplexDetail(1);

      expect(result.localityAttributes).toEqual({
        transportation: '정보 없음',
        commercialArea: '정보 없음',
        schoolDistrict: '정보 없음',
        gangnamAccessibility: '정보 없음',
        entertainmentAndParks: '정보 없음',
        developmentProspects: '정보 없음',
        nearbyJobs: '정보 없음',
      });
    });

    it('locality-enrichment 서비스에 매핑된 속성과 좌표를 전달하고 반환값을 결과로 사용한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseRow);
      apartmentComplexPriceService.getComplexPriceRange.mockResolvedValue('매물 없음');
      localityEnrichmentService.enrichLocalityAttributes.mockResolvedValue({
        transportation: '지하철 SRT 동탄역 도보 10분',
        commercialArea: '정보 없음',
        schoolDistrict: '동탄중앙초등학교 (350m 이내)',
        gangnamAccessibility: '정보 없음',
        entertainmentAndParks: '유흥주점 없음 (700m 이내)',
        developmentProspects: '정보 없음',
        nearbyJobs: '정보 없음',
      });

      const result = await getComplexDetail(1);

      expect(localityEnrichmentService.enrichLocalityAttributes).toHaveBeenCalledWith(
        expect.objectContaining({ transportation: '지하철 SRT 동탄역 도보 10분', schoolDistrict: '정보 없음' }),
        baseRow.latitude,
        baseRow.longitude
      );
      expect(result.localityAttributes.schoolDistrict).toBe('동탄중앙초등학교 (350m 이내)');
      expect(result.localityAttributes.entertainmentAndParks).toBe('유흥주점 없음 (700m 이내)');
    });
  });

  describe('listComplexSummaries', () => {
    it('repository가 빈 배열을 반환하면 결과도 빈 배열이고 price 서비스는 호출되지 않는다', async () => {
      apartmentComplexesRepository.findAll.mockResolvedValue([]);

      const result = await listComplexSummaries();

      expect(result).toEqual([]);
      expect(apartmentComplexPriceService.getComplexPriceRange).toHaveBeenCalledTimes(0);
    });

    it('여러 row를 camelCase로 매핑하고 priceRange 키를 포함하지 않는다', async () => {
      apartmentComplexesRepository.findAll.mockResolvedValue([
        baseRow,
        {
          ...baseRow,
          id: 2,
          complex_name: '평택 소사벌 한라비발디',
          is_land_transaction_permission_zone: null,
          nearest_shuttle_stop_name: null,
          nearest_shuttle_stop_distance: null,
          shuttle_commute_minutes: null,
        },
      ]);

      const result = await listComplexSummaries();

      expect(result).toEqual([
        {
          id: 1,
          complexName: '동탄역 시범 우남퍼스트빌',
          address: '경기도 화성시 동탄역로 123',
          completionYear: 1998,
          remodelingStatus: '해당없음',
          reconstructionStatus: '해당없음',
          isRegulatedArea: true,
          isLandTransactionPermissionZone: true,
          nearestShuttleStopName: '동탄역 셔틀정류장',
          nearestShuttleStopDistance: 350,
          shuttleCommuteMinutes: 42,
        },
        {
          id: 2,
          complexName: '평택 소사벌 한라비발디',
          address: '경기도 화성시 동탄역로 123',
          completionYear: 1998,
          remodelingStatus: '해당없음',
          reconstructionStatus: '해당없음',
          isRegulatedArea: true,
          isLandTransactionPermissionZone: '확인필요',
          nearestShuttleStopName: null,
          nearestShuttleStopDistance: null,
          shuttleCommuteMinutes: null,
        },
      ]);
      result.forEach((item) => {
        expect(item).not.toHaveProperty('priceRange');
      });
      expect(apartmentComplexPriceService.getComplexPriceRange).not.toHaveBeenCalled();
    });
  });
});
