const {
  notFoundHandler,
  errorHandler,
} = require('../../src/middlewares/error-handler');

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('middlewares/error-handler', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('notFoundHandler', () => {
    it('항상 404와 { message } 형태의 JSON을 응답한다', () => {
      const req = {};
      const res = createRes();
      const next = jest.fn();

      notFoundHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
    });
  });

  describe('errorHandler', () => {
    it('err.status가 있으면 해당 status와 message로 응답한다', () => {
      const err = { status: 400, message: '잘못된 요청' };
      const req = {};
      const res = createRes();
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '잘못된 요청' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('err.statusCode가 있으면 해당 statusCode로 응답한다', () => {
      const err = { statusCode: 403, message: '접근 금지' };
      const req = {};
      const res = createRes();
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: '접근 금지' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('status가 없는 일반 Error는 500과 일반 메시지로 응답하고 스택트레이스를 노출하지 않는다', () => {
      const err = new Error('DB connection failed at internal-host:5432');
      const req = {};
      const res = createRes();
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.message).not.toBe(err.message);
      expect(responseBody.message).not.toContain('internal-host');
      expect(responseBody.message).not.toContain(err.stack);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
