jest.mock('../../src/services/apartment-complexes.service');
jest.mock('../../src/services/complex-detail.service');

const apartmentComplexesService = require('../../src/services/apartment-complexes.service');
const complexDetailService = require('../../src/services/complex-detail.service');
const {
  listComplexes,
  getComplex,
  getPriceHistory,
  getJeonseHistory,
  getAssignedSchools,
  getRemodeling,
  getDevelopmentProjects,
  getRegulation,
  getLoanSimulation,
} = require('../../src/controllers/complexes.controller');

const createRes = () => ({
  json: jest.fn(),
});

describe('controllers/complexes.controller', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getComplex', () => {
    it('서비스가 null을 반환하면 status 404인 Error로 next를 호출하고 res.json은 호출되지 않는다', async () => {
      apartmentComplexesService.getComplexDetail.mockResolvedValue(null);
      const req = { params: { id: '999999' } };
      const res = createRes();
      const next = jest.fn();

      await getComplex(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(404);
      expect(res.json).not.toHaveBeenCalled();
    });

    it('서비스가 객체를 반환하면 res.json이 그 객체로 호출된다', async () => {
      const detail = { id: 1, complexName: '동탄역 시범 우남퍼스트빌' };
      apartmentComplexesService.getComplexDetail.mockResolvedValue(detail);
      const req = { params: { id: '1' } };
      const res = createRes();
      const next = jest.fn();

      await getComplex(req, res, next);

      expect(res.json).toHaveBeenCalledWith(detail);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('listComplexes', () => {
    it('서비스가 배열을 반환하면 res.json이 그 배열로 호출된다', async () => {
      const summaries = [
        { id: 1, complexName: '동탄역 시범 우남퍼스트빌' },
        { id: 2, complexName: '평택 소사벌 한라비발디' },
      ];
      apartmentComplexesService.listComplexSummaries.mockResolvedValue(summaries);
      const req = {};
      const res = createRes();
      const next = jest.fn();

      await listComplexes(req, res, next);

      expect(res.json).toHaveBeenCalledWith(summaries);
    });

    it('서비스가 빈 배열을 반환하면 res.json이 빈 배열로 호출된다', async () => {
      apartmentComplexesService.listComplexSummaries.mockResolvedValue([]);
      const req = {};
      const res = createRes();
      const next = jest.fn();

      await listComplexes(req, res, next);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('getPriceHistory', () => {
    it('서비스가 null이면 404, 값이 있으면 res.json으로 반환한다', async () => {
      complexDetailService.getPriceHistory.mockResolvedValue(null);
      const next1 = jest.fn();
      await getPriceHistory({ params: { id: '999' } }, createRes(), next1);
      expect(next1.mock.calls[0][0].status).toBe(404);

      const result = { complexId: 1, entries: [] };
      complexDetailService.getPriceHistory.mockResolvedValue(result);
      const res2 = createRes();
      await getPriceHistory({ params: { id: '1' } }, res2, jest.fn());
      expect(complexDetailService.getPriceHistory).toHaveBeenCalledWith(1);
      expect(res2.json).toHaveBeenCalledWith(result);
    });
  });

  describe('getJeonseHistory', () => {
    it('서비스 결과를 그대로 반환한다', async () => {
      const result = { complexId: 1, saleEntries: [], jeonseEntries: [], ratioEntries: [] };
      complexDetailService.getJeonseHistory.mockResolvedValue(result);
      const res = createRes();
      await getJeonseHistory({ params: { id: '1' }, query: {} }, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('query의 exclusiveArea를 Number로 변환해 서비스에 전달한다', async () => {
      complexDetailService.getJeonseHistory.mockResolvedValue({});
      await getJeonseHistory({ params: { id: '1' }, query: { exclusiveArea: '84.98' } }, createRes(), jest.fn());
      expect(complexDetailService.getJeonseHistory).toHaveBeenCalledWith(1, { exclusiveArea: 84.98 });
    });
  });

  describe('getAssignedSchools', () => {
    it('서비스 결과를 그대로 반환한다', async () => {
      const result = { complexId: 1, elementarySchool: null, middleSchool: null };
      complexDetailService.getAssignedSchools.mockResolvedValue(result);
      const res = createRes();
      await getAssignedSchools({ params: { id: '1' } }, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });

  describe('getRemodeling', () => {
    it('서비스 결과를 그대로 반환한다', async () => {
      const result = { complexId: 1, hasProject: false };
      complexDetailService.getRemodeling.mockResolvedValue(result);
      const res = createRes();
      await getRemodeling({ params: { id: '1' } }, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });

  describe('getDevelopmentProjects', () => {
    it('서비스 결과를 그대로 반환한다', async () => {
      const result = { complexId: 1, projects: [] };
      complexDetailService.getDevelopmentProjects.mockResolvedValue(result);
      const res = createRes();
      await getDevelopmentProjects({ params: { id: '1' } }, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('서비스가 null을 반환하면 404 에러로 next를 호출한다', async () => {
      complexDetailService.getDevelopmentProjects.mockResolvedValue(null);
      const next = jest.fn();
      await getDevelopmentProjects({ params: { id: '999999' } }, createRes(), next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].status).toBe(404);
    });
  });

  describe('getRegulation', () => {
    it('query의 salePrice를 Number로 변환해 서비스에 전달한다', async () => {
      complexDetailService.getRegulation.mockResolvedValue({ complexId: 1 });
      await getRegulation({ params: { id: '1' }, query: { salePrice: '95000' } }, createRes(), jest.fn());
      expect(complexDetailService.getRegulation).toHaveBeenCalledWith(1, { salePrice: 95000 });
    });

    it('salePrice가 없으면 undefined로 전달한다', async () => {
      complexDetailService.getRegulation.mockResolvedValue({ complexId: 1 });
      await getRegulation({ params: { id: '1' }, query: {} }, createRes(), jest.fn());
      expect(complexDetailService.getRegulation).toHaveBeenCalledWith(1, { salePrice: undefined });
    });
  });

  describe('getLoanSimulation', () => {
    it('query의 salePrice를 Number로 변환해 서비스에 전달한다', async () => {
      complexDetailService.getLoanSimulation.mockResolvedValue({ complexId: 1 });
      await getLoanSimulation({ params: { id: '1' }, query: { salePrice: '95000' } }, createRes(), jest.fn());
      expect(complexDetailService.getLoanSimulation).toHaveBeenCalledWith(1, { salePrice: 95000 });
    });
  });
});
