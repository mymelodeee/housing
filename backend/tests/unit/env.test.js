jest.mock('dotenv', () => ({ config: jest.fn() }));

const REQUIRED_KEYS = ['PORT', 'POSTGRES_CONNECTION_STRING', 'CORS_ORIGIN'];

describe('config/env', () => {
  let originalEnv;
  let exitSpy;
  let errorSpy;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe.each(REQUIRED_KEYS)('%s가 없을 때', (missingKey) => {
    beforeEach(() => {
      process.env.PORT = '3000';
      process.env.POSTGRES_CONNECTION_STRING = 'postgresql://test';
      process.env.CORS_ORIGIN = 'http://localhost:5173';
      delete process.env[missingKey];
    });

    it('process.exit(1)이 호출되고 [ERROR] 접두사가 출력된다', () => {
      require('../../src/config/env');

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalled();
      const loggedMessage = errorSpy.mock.calls
        .map((call) => call.join(' '))
        .join('\n');
      expect(loggedMessage).toContain('[ERROR]');
    });
  });

  describe('필수 환경변수가 모두 있을 때', () => {
    beforeEach(() => {
      process.env.PORT = '3000';
      process.env.POSTGRES_CONNECTION_STRING = 'postgresql://test';
      process.env.CORS_ORIGIN = 'http://localhost:5173';
    });

    it('정상적으로 env 객체를 export한다', () => {
      const env = require('../../src/config/env');

      expect(exitSpy).not.toHaveBeenCalled();
      expect(env).toEqual(
        expect.objectContaining({
          port: expect.any(Number),
          postgresConnectionString: expect.any(String),
          corsOrigins: expect.any(Array),
        })
      );
      expect(env.port).toBe(3000);
      expect(env.postgresConnectionString).toBe('postgresql://test');
      expect(env.corsOrigins).toContain('http://localhost:5173');
    });
  });
});
