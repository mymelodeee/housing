jest.mock('../../src/services/apartment-complexes.service');

const apartmentComplexesService = require('../../src/services/apartment-complexes.service');
const {
  listComplexes,
  getComplex,
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
});
