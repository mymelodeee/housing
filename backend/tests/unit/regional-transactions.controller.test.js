jest.mock('../../src/services/regional-transactions.service');

const regionalTransactionsService = require('../../src/services/regional-transactions.service');
const { searchRecentTransactions, selectRecentTransaction, selectRecentTransactionComplex } = require('../../src/controllers/regional-transactions.controller');

const createRes = () => ({
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
});

describe('controllers/regional-transactions.controller', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('searchRecentTransactions', () => {
    it('query 값이 문자열이어도 Number로 변환되어 service가 호출된다', async () => {
      regionalTransactionsService.searchRecentTransactions.mockResolvedValue([]);
      const req = { query: { minPrice: '90000', maxPrice: '150000', minArea: '60', maxArea: '90' } };
      const res = createRes();
      const next = jest.fn();

      await searchRecentTransactions(req, res, next);

      expect(regionalTransactionsService.searchRecentTransactions).toHaveBeenCalledWith({
        minPrice: 90000,
        maxPrice: 150000,
        minArea: 60,
        maxArea: 90,
      });
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('query가 비어있으면 모든 필드가 undefined로 service에 전달된다', async () => {
      regionalTransactionsService.searchRecentTransactions.mockResolvedValue([]);
      const req = { query: {} };
      const res = createRes();
      const next = jest.fn();

      await searchRecentTransactions(req, res, next);

      expect(regionalTransactionsService.searchRecentTransactions).toHaveBeenCalledWith({
        minPrice: undefined,
        maxPrice: undefined,
        minArea: undefined,
        maxArea: undefined,
      });
    });

    it('city 값이 있으면 그대로 service에 전달된다', async () => {
      regionalTransactionsService.searchRecentTransactions.mockResolvedValue([]);
      const req = { query: { city: '용인시' } };
      const res = createRes();
      const next = jest.fn();

      await searchRecentTransactions(req, res, next);

      expect(regionalTransactionsService.searchRecentTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ city: '용인시' })
      );
    });

    it('service에서 에러가 발생하면 next로 전달된다', async () => {
      const error = new Error('DB 오류');
      regionalTransactionsService.searchRecentTransactions.mockRejectedValue(error);
      const req = { query: {} };
      const res = createRes();
      const next = jest.fn();

      await searchRecentTransactions(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('selectRecentTransaction', () => {
    it('service가 null을 반환하면 status 404인 Error로 next를 호출한다', async () => {
      regionalTransactionsService.selectCacheEntry.mockResolvedValue(null);
      const req = { body: { id: '999999' } };
      const res = createRes();
      const next = jest.fn();

      await selectRecentTransaction(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(404);
      expect(res.json).not.toHaveBeenCalled();
    });

    it('service가 결과를 반환하면 201과 함께 res.json이 호출된다', async () => {
      regionalTransactionsService.selectCacheEntry.mockResolvedValue({ listingId: 10 });
      const req = { body: { id: '1' } };
      const res = createRes();
      const next = jest.fn();

      await selectRecentTransaction(req, res, next);

      expect(regionalTransactionsService.selectCacheEntry).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ listingId: 10 });
      expect(next).not.toHaveBeenCalled();
    });

    it('service에서 에러가 발생하면 next로 전달된다', async () => {
      const error = new Error('좌표 확인 불가');
      error.status = 422;
      regionalTransactionsService.selectCacheEntry.mockRejectedValue(error);
      const req = { body: { id: '1' } };
      const res = createRes();
      const next = jest.fn();

      await selectRecentTransaction(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('selectRecentTransactionComplex', () => {
    it('service가 null을 반환하면 status 404인 Error로 next를 호출한다', async () => {
      regionalTransactionsService.selectCacheEntryComplex.mockResolvedValue(null);
      const req = { body: { id: '999999' } };
      const res = createRes();
      const next = jest.fn();

      await selectRecentTransactionComplex(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].status).toBe(404);
      expect(res.json).not.toHaveBeenCalled();
    });

    it('service가 결과를 반환하면 201과 함께 res.json이 호출된다', async () => {
      regionalTransactionsService.selectCacheEntryComplex.mockResolvedValue({ complexId: 10 });
      const req = { body: { id: '1' } };
      const res = createRes();
      const next = jest.fn();

      await selectRecentTransactionComplex(req, res, next);

      expect(regionalTransactionsService.selectCacheEntryComplex).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ complexId: 10 });
    });
  });
});
