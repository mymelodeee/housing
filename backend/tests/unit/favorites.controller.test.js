jest.mock('../../src/services/favorites.service');

const favoritesService = require('../../src/services/favorites.service');
const {
  addComplexFavorite,
  addListingFavorite,
  removeComplexFavorite,
  removeListingFavorite,
  listComplexFavorites,
  listListingFavorites,
} = require('../../src/controllers/favorites.controller');

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('controllers/favorites.controller', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('addComplexFavorite', () => {
    it('service가 정상 반환하면 201과 결과를 응답한다', async () => {
      const result = { id: 1, userProfileId: 1, complexId: 1, registeredAt: new Date() };
      favoritesService.addComplexFavorite.mockResolvedValue(result);
      const req = { body: { complexId: 1 } };
      const res = createRes();
      const next = jest.fn();

      await addComplexFavorite(req, res, next);

      expect(favoritesService.addComplexFavorite).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(result);
      expect(next).not.toHaveBeenCalled();
    });

    it('service가 code 23505 에러를 throw하면 409와 message를 응답하고 next는 호출되지 않는다', async () => {
      const err = new Error('duplicate');
      err.code = '23505';
      favoritesService.addComplexFavorite.mockRejectedValue(err);
      const req = { body: { complexId: 1 } };
      const res = createRes();
      const next = jest.fn();

      await addComplexFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('addListingFavorite', () => {
    it('service가 정상 반환하면 201과 결과를 응답한다', async () => {
      const result = { id: 1, userProfileId: 1, listingId: 1, registeredAt: new Date() };
      favoritesService.addListingFavorite.mockResolvedValue(result);
      const req = { body: { listingId: 1 } };
      const res = createRes();
      const next = jest.fn();

      await addListingFavorite(req, res, next);

      expect(favoritesService.addListingFavorite).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(result);
      expect(next).not.toHaveBeenCalled();
    });

    it('service가 code 23505 에러를 throw하면 409와 message를 응답하고 next는 호출되지 않는다', async () => {
      const err = new Error('duplicate');
      err.code = '23505';
      favoritesService.addListingFavorite.mockRejectedValue(err);
      const req = { body: { listingId: 1 } };
      const res = createRes();
      const next = jest.fn();

      await addListingFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('removeComplexFavorite', () => {
    it('service가 truthy를 반환하면 200을 응답한다', async () => {
      favoritesService.removeComplexFavorite.mockResolvedValue({ id: 1 });
      const req = { params: { complexId: '1' } };
      const res = createRes();
      const next = jest.fn();

      await removeComplexFavorite(req, res, next);

      expect(favoritesService.removeComplexFavorite).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('service가 null을 반환하면 status 404인 에러로 next를 호출한다', async () => {
      favoritesService.removeComplexFavorite.mockResolvedValue(null);
      const req = { params: { complexId: '999999' } };
      const res = createRes();
      const next = jest.fn();

      await removeComplexFavorite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(404);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('removeListingFavorite', () => {
    it('service가 truthy를 반환하면 200을 응답한다', async () => {
      favoritesService.removeListingFavorite.mockResolvedValue({ id: 1 });
      const req = { params: { listingId: '1' } };
      const res = createRes();
      const next = jest.fn();

      await removeListingFavorite(req, res, next);

      expect(favoritesService.removeListingFavorite).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('service가 null을 반환하면 status 404인 에러로 next를 호출한다', async () => {
      favoritesService.removeListingFavorite.mockResolvedValue(null);
      const req = { params: { listingId: '999999' } };
      const res = createRes();
      const next = jest.fn();

      await removeListingFavorite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(404);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listComplexFavorites', () => {
    it('service가 반환한 배열을 그대로 res.json으로 응답한다', async () => {
      const list = [{ id: 1, userProfileId: 1, complexId: 1, registeredAt: new Date(), complex: {} }];
      favoritesService.listComplexFavorites.mockResolvedValue(list);
      const req = {};
      const res = createRes();
      const next = jest.fn();

      await listComplexFavorites(req, res, next);

      expect(res.json).toHaveBeenCalledWith(list);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('listListingFavorites', () => {
    it('service가 반환한 배열을 그대로 res.json으로 응답한다', async () => {
      const list = [{ id: 1, userProfileId: 1, listingId: 1, registeredAt: new Date(), listing: {} }];
      favoritesService.listListingFavorites.mockResolvedValue(list);
      const req = {};
      const res = createRes();
      const next = jest.fn();

      await listListingFavorites(req, res, next);

      expect(res.json).toHaveBeenCalledWith(list);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
