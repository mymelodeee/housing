jest.mock('../../src/repositories/apartment-complexes.repository');
jest.mock('../../src/services/molit-price-history.service');
jest.mock('../../src/services/jeonse-history.service');
jest.mock('../../src/services/elementary-school.service');
jest.mock('../../src/services/user-profile.service');
jest.mock('../../src/services/loan-limit.service');
jest.mock('../../src/services/loan-scenario.service');
jest.mock('../../src/repositories/remodeling.repository');
jest.mock('../../src/services/development-projects.service');
jest.mock('../../src/services/academy.service');
jest.mock('../../src/services/market-interest-rate.service');

const apartmentComplexesRepository = require('../../src/repositories/apartment-complexes.repository');
const molitPriceHistoryService = require('../../src/services/molit-price-history.service');
const jeonseHistoryService = require('../../src/services/jeonse-history.service');
const elementarySchoolService = require('../../src/services/elementary-school.service');
const userProfileService = require('../../src/services/user-profile.service');
const loanLimitService = require('../../src/services/loan-limit.service');
const loanScenarioService = require('../../src/services/loan-scenario.service');
const remodelingRepository = require('../../src/repositories/remodeling.repository');
const developmentProjectsService = require('../../src/services/development-projects.service');
const academyService = require('../../src/services/academy.service');
const marketInterestRateService = require('../../src/services/market-interest-rate.service');
const {
  getPriceHistory,
  getJeonseHistory,
  getAssignedSchools,
  getRemodeling,
  getDevelopmentProjects,
  getRegulation,
  getLoanSimulation,
  getAcquisitionCosts,
  getLoanSchedule,
  getHoldingTaxEstimate,
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

const baseInterestRate = {
  ratePercent: 4.48,
  referencePeriod: '2026-07',
  sourceName: '한국은행 금융기관 가중평균금리',
  sourceUrl: 'https://www.bok.or.kr',
  checkedAt: '2026-09-08',
  daysSinceChecked: 0,
  isStale: false,
  sourceLabel: '한국은행 금융기관 가중평균금리(2026-07 기준, 2026-09-08 확인).',
};

describe('services/complex-detail.service', () => {
  beforeEach(() => {
    marketInterestRateService.getCurrentRate.mockResolvedValue(baseInterestRate);
  });

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
        availableExclusiveAreas: [],
        lookupWindowNote: '실시간 연동 특성상 최근 3년(36개월) 범위만 조회합니다',
      });
    });

    it('exclusiveArea 미지정 시 전체 평형의 availableExclusiveAreas를 함께 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      molitPriceHistoryService.fetchPriceHistoryForComplex.mockResolvedValue({
        entries: [
          { transactionDate: '2026-01-01', transactionPrice: 95000, exclusiveArea: 84.98, dataSource: 'x' },
          { transactionDate: '2026-02-01', transactionPrice: 60000, exclusiveArea: 59.95, dataSource: 'x' },
        ],
      });
      jeonseHistoryService.fetchJeonseTransactionsForComplex.mockResolvedValue([
        { transactionDate: '2026-01-05', deposit: 70000, exclusiveArea: 84.98, dataSource: 'y' },
      ]);
      jeonseHistoryService.buildJeonseRatioEntries.mockReturnValue([{ month: '2026-01', jeonseRatioPercent: 73.7 }]);

      const result = await getJeonseHistory(10);

      expect(result.saleEntries).toHaveLength(2);
      expect(result.availableExclusiveAreas).toEqual([59.95, 84.98]);
    });

    it('exclusiveArea를 지정하면 매매/전세 목록과 전세가율을 해당 평형 기준으로 재계산한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      molitPriceHistoryService.fetchPriceHistoryForComplex.mockResolvedValue({
        entries: [
          { transactionDate: '2026-01-01', transactionPrice: 95000, exclusiveArea: 84.98, dataSource: 'x' },
          { transactionDate: '2026-02-01', transactionPrice: 60000, exclusiveArea: 59.95, dataSource: 'x' },
        ],
      });
      jeonseHistoryService.fetchJeonseTransactionsForComplex.mockResolvedValue([
        { transactionDate: '2026-01-05', deposit: 70000, exclusiveArea: 84.98, dataSource: 'y' },
        { transactionDate: '2026-02-05', deposit: 40000, exclusiveArea: 59.95, dataSource: 'y' },
      ]);

      const result = await getJeonseHistory(10, { exclusiveArea: 84.98 });

      expect(result.saleEntries).toEqual([
        { transactionDate: '2026-01-01', transactionPrice: 95000, exclusiveArea: 84.98, dataSource: 'x' },
      ]);
      expect(result.jeonseEntries).toEqual([
        { transactionDate: '2026-01-05', deposit: 70000, exclusiveArea: 84.98, dataSource: 'y' },
      ]);
      expect(jeonseHistoryService.buildJeonseRatioEntries).toHaveBeenCalledWith({
        saleEntries: [{ transactionDate: '2026-01-01', transactionPrice: 95000, exclusiveArea: 84.98, dataSource: 'x' }],
        jeonseEntries: [{ transactionDate: '2026-01-05', deposit: 70000, exclusiveArea: 84.98, dataSource: 'y' }],
      });
      expect(result.availableExclusiveAreas).toEqual([59.95, 84.98]);
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
        highSchool: null,
        academyCount: null,
        assignmentNote: expect.any(String),
      });
    });

    it('좌표가 있으면 초/중/고 최근접 학교와 학원가 밀집도를 조회한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      elementarySchoolService.findNearestSchoolByLevel.mockResolvedValueOnce({ schoolName: 'A초', distanceMeters: 300 });
      elementarySchoolService.findNearestSchoolByLevel.mockResolvedValueOnce({ schoolName: 'B중', distanceMeters: 500 });
      elementarySchoolService.findNearestSchoolByLevel.mockResolvedValueOnce({ schoolName: 'C고', distanceMeters: 800 });
      academyService.countAcademiesWithin1km.mockResolvedValue(12);

      const result = await getAssignedSchools(10);

      expect(elementarySchoolService.findNearestSchoolByLevel).toHaveBeenCalledWith(37.2, 127.09, '초등학교');
      expect(elementarySchoolService.findNearestSchoolByLevel).toHaveBeenCalledWith(37.2, 127.09, '중학교');
      expect(elementarySchoolService.findNearestSchoolByLevel).toHaveBeenCalledWith(37.2, 127.09, '고등학교');
      expect(academyService.countAcademiesWithin1km).toHaveBeenCalledWith(37.2, 127.09);
      expect(result.elementarySchool).toEqual({ schoolName: 'A초', distanceMeters: 300 });
      expect(result.middleSchool).toEqual({ schoolName: 'B중', distanceMeters: 500 });
      expect(result.highSchool).toEqual({ schoolName: 'C고', distanceMeters: 800 });
      expect(result.academyCount).toBe(12);
    });

    it('학원가 조회가 실패해도 나머지 결과는 정상 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      elementarySchoolService.findNearestSchoolByLevel.mockResolvedValue(null);
      academyService.countAcademiesWithin1km.mockRejectedValue(new Error('network'));

      const result = await getAssignedSchools(10);

      expect(result.academyCount).toBeNull();
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

  describe('getDevelopmentProjects', () => {
    it('존재하지 않는 단지면 null을 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(null);

      expect(await getDevelopmentProjects(999)).toBeNull();
      expect(developmentProjectsService.getDevelopmentProjects).not.toHaveBeenCalled();
    });

    it('단지가 존재하면 development-projects.service 결과를 그대로 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      developmentProjectsService.getDevelopmentProjects.mockResolvedValue({ complexId: 10, projects: [] });

      const result = await getDevelopmentProjects(10);

      expect(developmentProjectsService.getDevelopmentProjects).toHaveBeenCalledWith(10, '41597');
      expect(result).toEqual({ complexId: 10, projects: [] });
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

  describe('getAcquisitionCosts', () => {
    it('존재하지 않는 단지면 null을 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(null);
      expect(await getAcquisitionCosts(999, {})).toBeNull();
    });

    it('salePrice가 없고 유효한 실거래도 없으면 매매가 입력 필요 메시지를 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      molitPriceHistoryService.fetchPriceHistoryForComplex.mockResolvedValue({
        lookupPeriodType: '실거래 이력 없음',
        firstTransactionMonth: null,
        entries: [],
      });

      const result = await getAcquisitionCosts(10, {});

      expect(result.message).toBe('매매가 입력 필요');
      expect(result.effectiveSalePrice).toBeNull();
    });

    it('salePrice/exclusiveArea/homeCount 입력값 기준으로 취득세·중개보수·인지세를 계산한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({ housingOwnershipTier: '무주택' });

      const result = await getAcquisitionCosts(10, { salePrice: 95000, exclusiveArea: 84.98, homeCount: 1 });

      expect(result.effectiveSalePrice).toBe(95000);
      expect(result.salePriceSource).toBe('user');
      expect(result.homeCountAfterPurchase).toBe(1);
      expect(result.acquisitionTax.amount).toBe(Math.round(95000 * 10000 * 0.03));
      expect(result.ruralSpecialTax.amount).toBe(0);
      expect(result.brokerageFee.estimateType).toBe('ESTIMATE');
      expect(result.totalCost).toBe(
        result.acquisitionTax.amount + result.localEducationTax.amount + result.ruralSpecialTax.amount + result.brokerageFee.amount + result.stampDuty.amount
      );
    });

    it('homeCount 미지정이면 세대 주택 보유 구분에서 기본값을 추정한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({ housingOwnershipTier: '다주택' });

      const result = await getAcquisitionCosts(10, { salePrice: 95000 });

      expect(result.homeCountAfterPurchase).toBe(3);
    });
  });

  describe('getLoanSchedule', () => {
    it('존재하지 않는 단지면 null을 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(null);
      expect(await getLoanSchedule(999, { principal: 30000, interestRatePercent: 4 })).toBeNull();
    });

    it('principal/interestRatePercent가 없으면 안내 메시지를 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);

      const result = await getLoanSchedule(10, {});

      expect(result.message).toBe('원금과 금리 입력 필요');
      expect(result.schedule).toBeNull();
    });

    it('거치기간·상환기간을 반영한 월별 스케줄을 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);

      const result = await getLoanSchedule(10, { principal: 30000, interestRatePercent: 4, graceMonths: 12, years: 10 });

      expect(result.rows).toHaveLength(132);
      expect(result.cliffMonth).toBe(13);
      expect(result.cliffIncrease).toBeGreaterThan(0);
    });

    it('graceMonths/years 미지정 시 기본값(0개월 거치, 30년)을 사용한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);

      const result = await getLoanSchedule(10, { principal: 30000, interestRatePercent: 4 });

      expect(result.graceMonths).toBe(0);
      expect(result.years).toBe(30);
      expect(result.rows).toHaveLength(360);
    });
  });

  describe('getHoldingTaxEstimate', () => {
    it('존재하지 않는 단지면 null을 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(null);
      expect(await getHoldingTaxEstimate(999, {})).toBeNull();
    });

    it('publicPrice/salePrice가 모두 없고 유효한 실거래도 없으면 안내 메시지를 반환한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({ housingOwnershipTier: '무주택' });
      molitPriceHistoryService.fetchPriceHistoryForComplex.mockResolvedValue({
        lookupPeriodType: '실거래 이력 없음',
        firstTransactionMonth: null,
        entries: [],
      });

      const result = await getHoldingTaxEstimate(10, {});

      expect(result.message).toBe('매매가 또는 공시가격 입력 필요');
    });

    it('publicPrice를 직접 입력하면 그 값을 그대로 사용하고 publicPriceSource는 user다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({ housingOwnershipTier: '무주택' });

      const result = await getHoldingTaxEstimate(10, { publicPrice: 90000, homeCount: 1 });

      expect(result.publicPrice).toBe(90000);
      expect(result.publicPriceSource).toBe('user');
      expect(result.isOneHouse).toBe(true);
      expect(result.comprehensiveTax.estimateType).toBe('ESTIMATE');
      expect(result.totalAnnualHoldingTax).toBe(result.propertyTax.total + result.comprehensiveTax.total);
    });

    it('publicPrice 미지정 시 salePrice × publicRatio(기본 70%)로 추정하고 publicPriceSource는 estimated다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({ housingOwnershipTier: '무주택' });

      const result = await getHoldingTaxEstimate(10, { salePrice: 100000 });

      expect(result.publicPrice).toBe(70000);
      expect(result.publicPriceSource).toBe('estimated');
    });

    it('homeCount 미지정이면 세대 주택 보유 구분에서 기본값을 추정한다', async () => {
      apartmentComplexesRepository.findById.mockResolvedValue(baseComplexRow);
      userProfileService.getProfile.mockResolvedValue({ housingOwnershipTier: '다주택' });

      const result = await getHoldingTaxEstimate(10, { publicPrice: 90000 });

      expect(result.homeCountAfterPurchase).toBe(3);
      expect(result.isOneHouse).toBe(false);
    });
  });
});
