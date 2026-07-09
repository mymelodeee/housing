jest.mock('../../src/repositories/listings.repository');
jest.mock('../../src/repositories/apartment-complexes.repository');
jest.mock('../../src/services/apartment-complexes.service', () => {
  const actual = jest.requireActual('../../src/services/apartment-complexes.service');
  return {
    mapSummaryFields: jest.fn(actual.mapSummaryFields),
    getComplexDetail: jest.fn(),
  };
});
jest.mock('../../src/services/user-profile.service');
jest.mock('../../src/services/loan-limit.service');
jest.mock('../../src/services/loan-scenario.service');

const listingsRepository = require('../../src/repositories/listings.repository');
const apartmentComplexesRepository = require('../../src/repositories/apartment-complexes.repository');
const apartmentComplexesService = require('../../src/services/apartment-complexes.service');
const userProfileService = require('../../src/services/user-profile.service');
const loanLimitService = require('../../src/services/loan-limit.service');
const loanScenarioService = require('../../src/services/loan-scenario.service');
const {
  listListings,
  getListingDetail,
  getListingLocality,
  getPriceHistory,
  getListingRegulation,
  getListingLoanSimulation,
} = require('../../src/services/listings.service');

const POLICY_MORTGAGE_NOTICE =
  '디딤돌대출·보금자리론 등 정책모기지는 계산 범위에서 제외되며, 필요 시 한국주택금융공사·주택도시기금 채널에서 별도 확인이 필요합니다.';

const baseRow = {
  id: 1,
  complex_id: 10,
  sale_price: 95000,
  exclusive_area: 84.98,
  c_id: 10,
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
};

describe('services/listings.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listListings', () => {
    it('인자 없이 호출 시 minPrice/maxPrice 기본값(70000/150000)이 적용되어 repository가 호출된다', async () => {
      listingsRepository.findByPriceRange.mockResolvedValue([]);

      await listListings({});

      expect(listingsRepository.findByPriceRange).toHaveBeenCalledWith({
        minPrice: 70000,
        maxPrice: 150000,
        minLat: undefined,
        maxLat: undefined,
        minLng: undefined,
        maxLng: undefined,
      });
    });

    it('minPrice/maxPrice가 지정되면 그 값 그대로 repository에 전달된다', async () => {
      listingsRepository.findByPriceRange.mockResolvedValue([]);

      await listListings({ minPrice: 100000, maxPrice: 150000 });

      expect(listingsRepository.findByPriceRange).toHaveBeenCalledWith({
        minPrice: 100000,
        maxPrice: 150000,
        minLat: undefined,
        maxLat: undefined,
        minLng: undefined,
        maxLng: undefined,
      });
    });

    it('좌표 4개가 모두 지정되면 그대로 repository에 전달된다', async () => {
      listingsRepository.findByPriceRange.mockResolvedValue([]);

      await listListings({
        minPrice: 70000,
        maxPrice: 150000,
        minLat: 37.0,
        maxLat: 37.3,
        minLng: 127.0,
        maxLng: 127.2,
      });

      expect(listingsRepository.findByPriceRange).toHaveBeenCalledWith({
        minPrice: 70000,
        maxPrice: 150000,
        minLat: 37.0,
        maxLat: 37.3,
        minLng: 127.0,
        maxLng: 127.2,
      });
    });

    it('repository가 빈 배열을 반환하면 결과도 빈 배열이다', async () => {
      listingsRepository.findByPriceRange.mockResolvedValue([]);

      const result = await listListings({});

      expect(result).toEqual([]);
    });

    it('셔틀 필드가 전부 null인 row는 complex의 셔틀 필드도 null로 유지되고 다른 필드는 정상 매핑된다', async () => {
      listingsRepository.findByPriceRange.mockResolvedValue([
        {
          ...baseRow,
          complex_name: '평택 소사벌 한라비발디',
          sale_price: 105000,
          exclusive_area: 74.52,
          is_land_transaction_permission_zone: null,
          nearest_shuttle_stop_name: null,
          nearest_shuttle_stop_distance: null,
          shuttle_commute_minutes: null,
        },
      ]);

      const result = await listListings({});

      expect(apartmentComplexesService.mapSummaryFields).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].salePrice).toBe(105000);
      expect(result[0].exclusiveArea).toBe(74.52);
      expect(result[0].complex.nearestShuttleStopName).toBeNull();
      expect(result[0].complex.nearestShuttleStopDistance).toBeNull();
      expect(result[0].complex.shuttleCommuteMinutes).toBeNull();
      expect(result[0].complex.complexName).toBe('평택 소사벌 한라비발디');
    });
  });

  describe('getListingDetail', () => {
    it('repository가 null을 반환하면 서비스도 null을 반환한다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue(null);

      const result = await getListingDetail(999999);

      expect(result).toBeNull();
    });

    it('repository가 row를 반환하면 Listing 스키마로 매핑되어 반환된다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue(baseRow);

      const result = await getListingDetail(1);

      expect(result).toEqual({
        id: 1,
        complexId: 10,
        salePrice: 95000,
        exclusiveArea: 84.98,
        complex: expect.objectContaining({
          id: 10,
          complexName: '동탄역 시범 우남퍼스트빌',
          nearestShuttleStopName: '동탄역 셔틀정류장',
          nearestShuttleStopDistance: 350,
          shuttleCommuteMinutes: 42,
        }),
      });
    });
  });

  describe('getListingLocality', () => {
    it('매물이 존재하지 않으면 null을 반환하고 getComplexDetail은 호출되지 않는다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue(null);

      const result = await getListingLocality(999999);

      expect(result).toBeNull();
      expect(apartmentComplexesService.getComplexDetail).not.toHaveBeenCalled();
    });

    it('매물과 단지 정보가 있으면 입지 정보 스키마로 매핑되어 반환된다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue(baseRow);
      apartmentComplexesService.getComplexDetail.mockResolvedValue({
        completionYear: 1998,
        remodelingStatus: '해당없음',
        reconstructionStatus: '해당없음',
        nearbyRedevelopmentInfo: null,
        localityAttributes: {
          transportation: '지하철 SRT 동탄역 도보 10분',
          commercialArea: '정보 없음',
          schoolDistrict: '정보 없음',
          gangnamAccessibility: '정보 없음',
          entertainmentAndParks: '정보 없음',
          developmentProspects: '정보 없음',
          nearbyJobs: '정보 없음',
        },
      });

      const result = await getListingLocality(1);

      expect(apartmentComplexesService.getComplexDetail).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        listingId: 1,
        complexId: 10,
        completionYear: 1998,
        remodelingStatus: '해당없음',
        reconstructionStatus: '해당없음',
        nearbyRedevelopmentInfo: null,
        localityAttributes: {
          transportation: '지하철 SRT 동탄역 도보 10분',
          commercialArea: '정보 없음',
          schoolDistrict: '정보 없음',
          gangnamAccessibility: '정보 없음',
          entertainmentAndParks: '정보 없음',
          developmentProspects: '정보 없음',
          nearbyJobs: '정보 없음',
        },
      });
    });
  });

  describe('getPriceHistory', () => {
    it('repository가 null을 반환하면 서비스도 null을 반환하고 price-history repository는 호출되지 않는다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue(null);

      const result = await getPriceHistory(999999);

      expect(result).toBeNull();
      expect(apartmentComplexesRepository.findPriceHistoryByComplexId).not.toHaveBeenCalled();
    });

    it('매물과 실거래 이력이 있으면 listingId/complexId/lookupPeriodType/firstTransactionMonth/entries를 포함한 결과를 반환한다', async () => {
      // baseRow.completion_year(1998)는 현재 시점 기준 age >= 20이므로 "최근 20년" 분기를 탄다.
      listingsRepository.findByIdWithComplex.mockResolvedValue(baseRow);
      apartmentComplexesRepository.findPriceHistoryByComplexId.mockResolvedValue([
        { transaction_date: new Date('2021-06-01T00:00:00Z'), transaction_price: 78000 },
        { transaction_date: new Date('2023-02-14T00:00:00Z'), transaction_price: 92000 },
      ]);

      const result = await getPriceHistory(1);

      expect(apartmentComplexesRepository.findPriceHistoryByComplexId).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        listingId: 1,
        complexId: 10,
        lookupPeriodType: '최근 20년',
        firstTransactionMonth: null,
        entries: [
          {
            transactionDate: '2021-06-01',
            transactionPrice: 78000,
            dataSource: '국토교통부 아파트 실거래가 공개시스템(오픈API)',
          },
          {
            transactionDate: '2023-02-14',
            transactionPrice: 92000,
            dataSource: '국토교통부 아파트 실거래가 공개시스템(오픈API)',
          },
        ],
      });
    });
  });

  describe('getListingRegulation', () => {
    const completeProfile = {
      id: 1,
      workplace: '화성',
      ownershipStructure: '단독',
      annualIncome: 7000,
      annualBonus: 1000,
      availableCapital: 20000,
      housingOwnershipTier: '1주택',
      isFirstTimeBuyer: false,
    };

    const incompleteProfile = {
      id: 1,
      workplace: null,
      ownershipStructure: null,
      annualIncome: null,
      annualBonus: null,
      availableCapital: null,
      housingOwnershipTier: null,
      isFirstTimeBuyer: null,
    };

    it('repository가 null을 반환하면 서비스도 null을 반환한다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue(null);

      const result = await getListingRegulation(999999);

      expect(result).toBeNull();
      expect(userProfileService.getProfile).not.toHaveBeenCalled();
    });

    it('규제지역 + 토허구역 확정(true) + 프로필 완료 -> regulationConfirmationNeeded false, 토허구역 true, 지역 대출 한도 60000, occupancy/gap은 실제 truth table(zone=true -> occupancy 24, gap 불허)을 따른다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue({
        ...baseRow,
        id: 2,
        complex_id: 10,
        sale_price: 88000,
        is_regulated_area: true,
        is_land_transaction_permission_zone: true,
      });
      userProfileService.getProfile.mockResolvedValue(completeProfile);
      loanLimitService.calculateMaxLoanAmount.mockReturnValue({
        ltvPercent: 50,
        ltvCapAmount: 44000,
        dsrCapAmount: 70000,
        regionalCapAmount: 60000,
        maxLoanAmount: 44000,
      });

      const result = await getListingRegulation(2);

      expect(loanLimitService.calculateMaxLoanAmount).toHaveBeenCalledWith(
        expect.objectContaining({ isRegulatedArea: true })
      );
      expect(result).toEqual({
        listingId: 2,
        complexId: 10,
        isRegulatedArea: true,
        isLandTransactionPermissionZone: true,
        regulationConfirmationNeeded: false,
        ltvPercent: 50,
        maxLoanAmount: 44000,
        profileMessage: null,
        gapInvestmentAllowed: false,
        occupancyRequirementMonths: 24,
        regionalLoanCapAmount: 60000,
      });
    });

    it('토허구역 미확정(null) -> regulationConfirmationNeeded true, isLandTransactionPermissionZone "확인필요", LTV 계산은 raw is_regulated_area와 무관하게 isRegulatedArea:false로 호출된다(임시 비규제지역 적용), 단 응답의 isRegulatedArea는 raw 값 그대로', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue({
        ...baseRow,
        id: 3,
        complex_id: 20,
        sale_price: 105000,
        is_regulated_area: false,
        is_land_transaction_permission_zone: null,
      });
      userProfileService.getProfile.mockResolvedValue(completeProfile);
      loanLimitService.calculateMaxLoanAmount.mockReturnValue({
        ltvPercent: 60,
        ltvCapAmount: 63000,
        dsrCapAmount: 70000,
        regionalCapAmount: null,
        maxLoanAmount: 63000,
      });

      const result = await getListingRegulation(3);

      expect(loanLimitService.calculateMaxLoanAmount).toHaveBeenCalledWith(
        expect.objectContaining({ isRegulatedArea: false })
      );
      expect(result.isRegulatedArea).toBe(false);
      expect(result.regulationConfirmationNeeded).toBe(true);
      expect(result.isLandTransactionPermissionZone).toBe('확인필요');
    });

    it('토허구역 미확정(null)이면서 raw is_regulated_area가 true인 합성 케이스에서도 override가 적용되어 isRegulatedArea:false로 대출 계산이 호출된다(응답의 isRegulatedArea는 true 그대로 유지)', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue({
        ...baseRow,
        id: 4,
        complex_id: 20,
        sale_price: 105000,
        is_regulated_area: true,
        is_land_transaction_permission_zone: null,
      });
      userProfileService.getProfile.mockResolvedValue(completeProfile);
      loanLimitService.calculateMaxLoanAmount.mockReturnValue({
        ltvPercent: 60,
        ltvCapAmount: 63000,
        dsrCapAmount: 70000,
        regionalCapAmount: null,
        maxLoanAmount: 63000,
      });

      const result = await getListingRegulation(4);

      expect(loanLimitService.calculateMaxLoanAmount).toHaveBeenCalledWith(
        expect.objectContaining({ isRegulatedArea: false })
      );
      expect(result.isRegulatedArea).toBe(true);
      expect(result.regulationConfirmationNeeded).toBe(true);
      expect(result.isLandTransactionPermissionZone).toBe('확인필요');
    });

    it('프로필 미입력 -> ltvPercent/maxLoanAmount null, profileMessage 안내, 토허구역 아님(false) + 규제지역인 경우 isMortgageInRegulatedArea가 강제로 false 처리되어 gapInvestmentAllowed true / occupancyRequirementMonths null(실제 truth table 기준)', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue({
        ...baseRow,
        id: 5,
        complex_id: 10,
        sale_price: 88000,
        is_regulated_area: true,
        is_land_transaction_permission_zone: false,
      });
      userProfileService.getProfile.mockResolvedValue(incompleteProfile);

      const result = await getListingRegulation(5);

      expect(loanLimitService.calculateMaxLoanAmount).not.toHaveBeenCalled();
      expect(result).toEqual({
        listingId: 5,
        complexId: 10,
        isRegulatedArea: true,
        isLandTransactionPermissionZone: false,
        regulationConfirmationNeeded: false,
        ltvPercent: null,
        maxLoanAmount: null,
        profileMessage: '내 정보 입력 필요',
        gapInvestmentAllowed: true,
        occupancyRequirementMonths: null,
        regionalLoanCapAmount: 60000,
      });
    });
  });

  describe('getListingLoanSimulation', () => {
    const completeProfile = {
      id: 1,
      workplace: '화성',
      ownershipStructure: '단독',
      annualIncome: 7000,
      annualBonus: 1000,
      availableCapital: 20000,
      housingOwnershipTier: '1주택',
      isFirstTimeBuyer: false,
    };

    const incompleteProfile = {
      id: 1,
      workplace: null,
      ownershipStructure: null,
      annualIncome: null,
      annualBonus: null,
      availableCapital: null,
      housingOwnershipTier: null,
      isFirstTimeBuyer: null,
    };

    const dummyScenarios = [
      { ownershipStructure: '단독', maxLoanAmount: 40000, capitalSufficient: true, dsrUsageRate: 0.5 },
      { ownershipStructure: '부부합산', maxLoanAmount: 50000, capitalSufficient: true, dsrUsageRate: 0.3 },
    ];

    it('repository가 null을 반환하면 서비스도 null을 반환하고 getProfile은 호출되지 않는다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue(null);

      const result = await getListingLoanSimulation(999999);

      expect(result).toBeNull();
      expect(userProfileService.getProfile).not.toHaveBeenCalled();
    });

    it('프로필 미완료 -> profileIncomplete:true 형태 그대로 반환하고 loanScenarioService.buildScenarios는 호출되지 않는다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue({
        ...baseRow,
        id: 1,
        is_regulated_area: true,
        is_land_transaction_permission_zone: true,
      });
      userProfileService.getProfile.mockResolvedValue(incompleteProfile);

      const result = await getListingLoanSimulation(1);

      expect(loanScenarioService.buildScenarios).not.toHaveBeenCalled();
      expect(result).toEqual({
        listingId: 1,
        profileIncomplete: true,
        scenarios: null,
        recommendedScenario: null,
        policyMortgageNotice: POLICY_MORTGAGE_NOTICE,
      });
    });

    it('프로필 완료 + 토허구역 확정(non-null) -> buildScenarios가 raw is_regulated_area 값 그대로 isRegulatedArea로 호출된다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue({
        ...baseRow,
        id: 2,
        sale_price: 88000,
        is_regulated_area: true,
        is_land_transaction_permission_zone: true,
      });
      userProfileService.getProfile.mockResolvedValue(completeProfile);
      loanScenarioService.buildScenarios.mockReturnValue(dummyScenarios);
      loanScenarioService.selectRecommendedScenario.mockReturnValue('부부합산');

      const result = await getListingLoanSimulation(2);

      expect(loanScenarioService.buildScenarios).toHaveBeenCalledWith(
        expect.objectContaining({ isRegulatedArea: true, salePrice: 88000 })
      );
      expect(result).toEqual({
        listingId: 2,
        profileIncomplete: false,
        scenarios: dummyScenarios,
        recommendedScenario: '부부합산',
        policyMortgageNotice: POLICY_MORTGAGE_NOTICE,
      });
    });

    it('프로필 완료 + 토허구역 미확정(null, 평택형) -> raw is_regulated_area가 true여도 override되어 buildScenarios는 isRegulatedArea:false로 호출된다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue({
        ...baseRow,
        id: 3,
        sale_price: 105000,
        is_regulated_area: true,
        is_land_transaction_permission_zone: null,
      });
      userProfileService.getProfile.mockResolvedValue(completeProfile);
      loanScenarioService.buildScenarios.mockReturnValue(dummyScenarios);
      loanScenarioService.selectRecommendedScenario.mockReturnValue('단독');

      await getListingLoanSimulation(3);

      expect(loanScenarioService.buildScenarios).toHaveBeenCalledWith(
        expect.objectContaining({ isRegulatedArea: false })
      );
    });

    it('재계산(no caching) 검증: 동일 id를 두 번 호출해도 getProfile 결과가 다르면 결과도 그에 따라 달라진다', async () => {
      listingsRepository.findByIdWithComplex.mockResolvedValue({
        ...baseRow,
        id: 4,
        sale_price: 88000,
        is_regulated_area: true,
        is_land_transaction_permission_zone: true,
      });
      userProfileService.getProfile
        .mockResolvedValueOnce(incompleteProfile)
        .mockResolvedValueOnce(completeProfile);
      loanScenarioService.buildScenarios.mockReturnValue(dummyScenarios);
      loanScenarioService.selectRecommendedScenario.mockReturnValue('단독');

      const firstResult = await getListingLoanSimulation(4);
      const secondResult = await getListingLoanSimulation(4);

      expect(firstResult.profileIncomplete).toBe(true);
      expect(firstResult.scenarios).toBeNull();
      expect(secondResult.profileIncomplete).toBe(false);
      expect(secondResult.scenarios).toEqual(dummyScenarios);
      expect(firstResult).not.toEqual(secondResult);
      expect(userProfileService.getProfile).toHaveBeenCalledTimes(2);
    });
  });
});
