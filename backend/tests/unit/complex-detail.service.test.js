jest.mock('../../src/repositories/apartment-complexes.repository');
jest.mock('../../src/services/molit-price-history.service');
jest.mock('../../src/services/jeonse-history.service');
jest.mock('../../src/services/elementary-school.service');
jest.mock('../../src/services/user-profile.service');
jest.mock('../../src/services/loan-limit.service');
jest.mock('../../src/services/loan-scenario.service');
jest.mock('../../src/repositories/remodeling.repository');

const apartmentComplexesRepository = require('../../src/repositories/apartment-complexes.repository');
const molitPriceHistoryService = require('../../src/services/molit-price-history.service');
const jeonseHistoryService = require('../../src/services/jeonse-history.service');
const elementarySchoolService = require('../../src/services/elementary-school.service');
const userProfileService = require('../../src/services/user-profile.service');
const loanLimitService = require('../../src/services/loan-limit.service');
const loanScenarioService = require('../../src/services/loan-scenario.service');
const remodelingRepository = require('../../src/repositories/remodeling.repository');
const {
  getPriceHistory,
  getJeonseHistory,
  getAssignedSchools,
  getRemodeling,
  getRegulation,
  getLoanSimulation,
} = require('../../src/services/complex-detail.service');

const baseComplexRow = {
  id: 10,
  complex_name: '동탄역 시범 우남퍼스트빌',
  lawd_cd: '41597',
  molit_apt_name: '동탄역 시범 우남퍼스트빌',
  latitude: 37.2,
  longitude: 127.09,
  is_regulated_area: true,
  is_land_transaction_permission_zone: true,
};

describe('services/complex-detail.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPriceHistory', () => {
    it('존재하지 않는 단지면 null을 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(null);
      expect(await getPriceHistory(999)).toBeNull();
    });

    it('lawd_cd/molit_apt_name이 있으면 MOLIT 조회 결과에 complexId를 붙여 반환한다(listingId 없음)', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      molitPriceHistoryService.fetchPriceHistoryForComplex.mockResolvedValue({
        lookupPeriodType: '최근 3년',
        firstTransactionMonth: null,
        entries: [{ transactionDate: '2026-01-01', transactionPrice: 95000, dataSource: 'x' }],
      });

      const result = await getPriceHistory(10);

      expect(molitPriceHistoryService.fetchPriceHistoryForComplex).toHaveBeenCalledWith({
        lawdCd: '41597',
        aptName: '동탄역 시범 우남퍼스트빌',
      });
      expect(result).toEqual({
        complexId: 10,
        lookupPeriodType: '최근 3년',
        firstTransactionMonth: null,
        entries: [{ transactionDate: '2026-01-01', transactionPrice: 95000, dataSource: 'x' }],
        lookupWindowNote: '실시간 연동 특성상 최근 3년(36개월) 범위만 조회합니다',
      });
      expect(result.listingId).toBeUndefined();
    });
  });

  describe('getJeonseHistory', () => {
    it('lawd_cd/molit_apt_name이 없으면 빈 배열들을 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue({ ...baseComplexRow, lawd_cd: null });

      const result = await getJeonseHistory(10);

      expect(result).toEqual({
        complexId: 10,
        saleEntries: [],
        jeonseEntries: [],
        ratioEntries: [],
        lookupWindowNote: '실시간 연동 특성상 최근 3년(36개월) 범위만 조회합니다',
      });
    });
  });

  describe('getAssignedSchools', () => {
    it('좌표가 없으면 학교 정보 없이 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue({ ...baseComplexRow, latitude: null, longitude: null });

      const result = await getAssignedSchools(10);

      expect(result).toEqual({
        complexId: 10,
        elementarySchool: null,
        middleSchool: null,
        assignmentNote: expect.any(String),
      });
    });

    it('좌표가 있으면 초/중 최근접 학교를 조회한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      elementarySchoolService.findNearestSchoolByLevel.mockResolvedValueOnce({ schoolName: 'A초', distanceMeters: 300 });
      elementarySchoolService.findNearestSchoolByLevel.mockResolvedValueOnce({ schoolName: 'B중', distanceMeters: 500 });

      const result = await getAssignedSchools(10);

      expect(elementarySchoolService.findNearestSchoolByLevel).toHaveBeenCalledWith(37.2, 127.09, '초등학교');
      expect(elementarySchoolService.findNearestSchoolByLevel).toHaveBeenCalledWith(37.2, 127.09, '중학교');
      expect(result.elementarySchool).toEqual({ schoolName: 'A초', distanceMeters: 300 });
    });
  });

  describe('getRemodeling', () => {
    it('사업이 없으면 hasProject false 응답을 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      remodelingRepository.findProjectByComplexId.mockResolvedValue(null);

      const result = await getRemodeling(10);

      expect(result).toMatchObject({ complexId: 10, hasProject: false });
      expect(remodelingRepository.findProjectByComplexId).toHaveBeenCalledWith(10);
    });
  });

  describe('getRegulation', () => {
    it('프로필 미입력이면 profileMessage를 반환하고 salePrice 없이도 동작한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({ housingOwnershipTier: null });

      const result = await getRegulation(10, {});

      expect(result.profileMessage).toBe('내 정보 입력 필요');
      expect(result.ltvPercent).toBeNull();
    });

    it('프로필은 있지만 salePrice가 없고 유효한 실거래도 없으면 매매가 입력 필요 메시지를 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({ housingOwnershipTier: '무주택' });
      molitPriceHistoryService.fetchPriceHistoryForComplex.mockResolvedValue({
        lookupPeriodType: '실거래 이력 없음',
        firstTransactionMonth: null,
        entries: [],
      });

      const result = await getRegulation(10, {});

      expect(result.profileMessage).toBe('매매가 입력 필요');
      expect(loanLimitService.calculateMaxLoanAmount).not.toHaveBeenCalled();
    });

    it('프로필과 salePrice가 모두 있으면 대출한도를 계산하고 salePriceSource를 user로 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({
        housingOwnershipTier: '무주택',
        isFirstTimeBuyer: true,
        annualIncome: 6000,
        annualBonus: 0,
      });
      loanLimitService.calculateMaxLoanAmount.mockReturnValue({ ltvPercent: 40, maxLoanAmount: 38000 });

      const result = await getRegulation(10, { salePrice: 95000 });

      expect(loanLimitService.calculateMaxLoanAmount).toHaveBeenCalledWith(
        expect.objectContaining({ salePrice: 95000 })
      );
      expect(result.ltvPercent).toBe(40);
      expect(result.maxLoanAmount).toBe(38000);
      expect(result.effectiveSalePrice).toBe(95000);
      expect(result.salePriceSource).toBe('user');
      expect(result.referenceTransactionDate).toBeNull();
    });

    it('salePrice 미입력이어도 최신 실거래가 있으면 이를 기준가격으로 자동 사용한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({
        housingOwnershipTier: '무주택',
        isFirstTimeBuyer: true,
        annualIncome: 6000,
        annualBonus: 0,
      });
      molitPriceHistoryService.fetchPriceHistoryForComplex.mockResolvedValue({
        lookupPeriodType: '최근 3년',
        firstTransactionMonth: null,
        entries: [
          { transactionDate: '2026-06-01', transactionPrice: 90000, dataSource: 'x' },
          { transactionDate: '2026-08-25', transactionPrice: 92000, dataSource: 'x' },
        ],
      });
      loanLimitService.calculateMaxLoanAmount.mockReturnValue({ ltvPercent: 40, maxLoanAmount: 36800 });

      const result = await getRegulation(10, {});

      expect(loanLimitService.calculateMaxLoanAmount).toHaveBeenCalledWith(
        expect.objectContaining({ salePrice: 92000 })
      );
      expect(result.profileMessage).toBeNull();
      expect(result.effectiveSalePrice).toBe(92000);
      expect(result.salePriceSource).toBe('transaction');
      expect(result.referenceTransactionDate).toBe('2026-08-25');
    });
  });

  describe('getLoanSimulation', () => {
    it('salePrice가 없고 유효한 실거래도 없으면 scenarios 없이 salePriceRequired 플래그를 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({ housingOwnershipTier: '무주택' });
      molitPriceHistoryService.fetchPriceHistoryForComplex.mockResolvedValue({
        lookupPeriodType: '실거래 이력 없음',
        firstTransactionMonth: null,
        entries: [],
      });

      const result = await getLoanSimulation(10, {});

      expect(result).toMatchObject({ complexId: 10, profileIncomplete: false, scenarios: null, salePriceRequired: true });
      expect(loanScenarioService.buildScenarios).not.toHaveBeenCalled();
    });

    it('salePrice가 있으면 시나리오를 계산하고 salePriceSource를 user로 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({
        housingOwnershipTier: '무주택',
        annualIncome: 6000,
        annualBonus: 0,
        availableCapital: 30000,
      });
      loanScenarioService.buildScenarios.mockReturnValue([{ ownershipStructure: '단독' }]);
      loanScenarioService.selectRecommendedScenario.mockReturnValue('단독');

      const result = await getLoanSimulation(10, { salePrice: 95000 });

      expect(loanScenarioService.buildScenarios).toHaveBeenCalledWith(expect.objectContaining({ salePrice: 95000 }));
      expect(result.scenarios).toEqual([{ ownershipStructure: '단독' }]);
      expect(result.recommendedScenario).toBe('단독');
      expect(result.effectiveSalePrice).toBe(95000);
      expect(result.salePriceSource).toBe('user');
    });

    it('salePrice 미입력이어도 최신 실거래가 있으면 이를 기준가격으로 자동 사용해 시나리오를 계산한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({
        housingOwnershipTier: '무주택',
        annualIncome: 6000,
        annualBonus: 0,
        availableCapital: 30000,
      });
      molitPriceHistoryService.fetchPriceHistoryForComplex.mockResolvedValue({
        lookupPeriodType: '최근 3년',
        firstTransactionMonth: null,
        entries: [{ transactionDate: '2026-08-25', transactionPrice: 92000, dataSource: 'x' }],
      });
      loanScenarioService.buildScenarios.mockReturnValue([{ ownershipStructure: '단독' }]);
      loanScenarioService.selectRecommendedScenario.mockReturnValue('단독');

      const result = await getLoanSimulation(10, {});

      expect(loanScenarioService.buildScenarios).toHaveBeenCalledWith(expect.objectContaining({ salePrice: 92000 }));
      expect(result.scenarios).toEqual([{ ownershipStructure: '단독' }]);
      expect(result.effectiveSalePrice).toBe(92000);
      expect(result.salePriceSource).toBe('transaction');
      expect(result.referenceTransactionDate).toBe('2026-08-25');
      expect(result.salePriceRequired).toBeUndefined();
    });
  });
});
