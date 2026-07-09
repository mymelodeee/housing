jest.mock('../../src/services/listings.service');

const listingsService = require('../../src/services/listings.service');
const {
  listListings,
  getListing,
  getListingLocality,
  getListingRegulation,
  getListingLoanSimulation,
} = require('../../src/controllers/listings.controller');

const createRes = () => ({
  json: jest.fn(),
});

describe('controllers/listings.controller', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listListings', () => {
    it('query 값이 문자열이어도 Number로 변환되어 service가 호출된다', async () => {
      listingsService.listListings.mockResolvedValue([]);
      const req = {
        query: {
          minPrice: '90000',
          maxPrice: '150000',
          minLat: '37.0',
          maxLat: '37.3',
          minLng: '127.0',
          maxLng: '127.2',
        },
      };
      const res = createRes();
      const next = jest.fn();

      await listListings(req, res, next);

      expect(listingsService.listListings).toHaveBeenCalledWith({
        minPrice: 90000,
        maxPrice: 150000,
        minLat: 37.0,
        maxLat: 37.3,
        minLng: 127.0,
        maxLng: 127.2,
      });
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('query가 비어있으면 모든 필드가 undefined로 service에 전달된다', async () => {
      listingsService.listListings.mockResolvedValue([]);
      const req = { query: {} };
      const res = createRes();
      const next = jest.fn();

      await listListings(req, res, next);

      expect(listingsService.listListings).toHaveBeenCalledWith({
        minPrice: undefined,
        maxPrice: undefined,
        minLat: undefined,
        maxLat: undefined,
        minLng: undefined,
        maxLng: undefined,
      });
    });
  });

  describe('getListing', () => {
    it('service가 null을 반환하면 status 404인 Error로 next를 호출하고 res.json은 호출되지 않는다', async () => {
      listingsService.getListingDetail.mockResolvedValue(null);
      const req = { params: { id: '999999' } };
      const res = createRes();
      const next = jest.fn();

      await getListing(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(404);
      expect(res.json).not.toHaveBeenCalled();
    });

    it('service가 객체를 반환하면 res.json이 그 객체로 호출된다', async () => {
      const detail = { id: 1, complexId: 10, salePrice: 95000, exclusiveArea: 84.98, complex: {} };
      listingsService.getListingDetail.mockResolvedValue(detail);
      const req = { params: { id: '1' } };
      const res = createRes();
      const next = jest.fn();

      await getListing(req, res, next);

      expect(listingsService.getListingDetail).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(detail);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getListingLocality', () => {
    it('service가 null을 반환하면 status 404인 Error로 next를 호출하고 res.json은 호출되지 않는다', async () => {
      listingsService.getListingLocality.mockResolvedValue(null);
      const req = { params: { id: '999999' } };
      const res = createRes();
      const next = jest.fn();

      await getListingLocality(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(404);
      expect(res.json).not.toHaveBeenCalled();
    });

    it('service가 객체를 반환하면 res.json이 그 객체로 호출된다', async () => {
      const locality = {
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
      };
      listingsService.getListingLocality.mockResolvedValue(locality);
      const req = { params: { id: '1' } };
      const res = createRes();
      const next = jest.fn();

      await getListingLocality(req, res, next);

      expect(listingsService.getListingLocality).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(locality);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getListingRegulation', () => {
    it('service가 null을 반환하면 status 404인 Error로 next를 호출하고 res.json은 호출되지 않는다', async () => {
      listingsService.getListingRegulation.mockResolvedValue(null);
      const req = { params: { id: '999999' } };
      const res = createRes();
      const next = jest.fn();

      await getListingRegulation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(404);
      expect(res.json).not.toHaveBeenCalled();
    });

    it('service가 객체를 반환하면 res.json이 그 객체로 호출된다', async () => {
      const regulation = {
        listingId: 1,
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
      };
      listingsService.getListingRegulation.mockResolvedValue(regulation);
      const req = { params: { id: '1' } };
      const res = createRes();
      const next = jest.fn();

      await getListingRegulation(req, res, next);

      expect(listingsService.getListingRegulation).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(regulation);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getListingLoanSimulation', () => {
    it('service가 null을 반환하면 status 404인 Error로 next를 호출하고 res.json은 호출되지 않는다', async () => {
      listingsService.getListingLoanSimulation.mockResolvedValue(null);
      const req = { params: { id: '999999' } };
      const res = createRes();
      const next = jest.fn();

      await getListingLoanSimulation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(404);
      expect(res.json).not.toHaveBeenCalled();
    });

    it('service가 객체를 반환하면 res.json이 그 객체로 호출된다', async () => {
      const loanSimulation = {
        listingId: 1,
        profileIncomplete: false,
        scenarios: [
          { ownershipStructure: '단독', maxLoanAmount: 40000, capitalSufficient: true, dsrUsageRate: 0.5 },
          { ownershipStructure: '부부합산', maxLoanAmount: 50000, capitalSufficient: true, dsrUsageRate: 0.3 },
        ],
        recommendedScenario: '부부합산',
        policyMortgageNotice:
          '디딤돌대출·보금자리론 등 정책모기지는 계산 범위에서 제외되며, 필요 시 한국주택금융공사·주택도시기금 채널에서 별도 확인이 필요합니다.',
      };
      listingsService.getListingLoanSimulation.mockResolvedValue(loanSimulation);
      const req = { params: { id: '1' } };
      const res = createRes();
      const next = jest.fn();

      await getListingLoanSimulation(req, res, next);

      expect(listingsService.getListingLoanSimulation).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(loanSimulation);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
