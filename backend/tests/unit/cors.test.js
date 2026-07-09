jest.mock('../../src/config/env', () => ({
  port: 3000,
  postgresConnectionString: 'postgresql://test',
  corsOrigins: ['http://localhost:5173'],
}));

jest.mock('cors', () => jest.fn(() => jest.fn()));

describe('middlewares/cors', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const loadCorsOptions = () => {
    const cors = require('cors');
    require('../../src/middlewares/cors');

    expect(cors).toHaveBeenCalledTimes(1);
    return cors.mock.calls[0][0];
  };

  it('허용된 origin은 통과시킨다', (done) => {
    const corsOptions = loadCorsOptions();

    corsOptions.origin('http://localhost:5173', (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  it('허용되지 않은 origin은 거부한다', (done) => {
    const corsOptions = loadCorsOptions();

    corsOptions.origin('http://evil.com', (err, allowed) => {
      expect(allowed).not.toBe(true);
      done();
    });
  });

  it('origin 헤더가 없는 요청은 통과시킨다', (done) => {
    const corsOptions = loadCorsOptions();

    corsOptions.origin(undefined, (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });
});
