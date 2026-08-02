jest.mock('dotenv', () => ({ config: jest.fn() }));

const REQUIRED_KEYS = [
  'PORT',
  'POSTGRES_CONNECTION_STRING',
  'CORS_ORIGIN',
  'DATA_APT_KR_API_KEY',
  'DATA_APT_KR_API_KEY2',
  'DATA_STORE_API_KEY',
  'DATA_GEOCODING_CLIENT_ID',
  'DATA_GEOCODING_CLIENT_SECRET'
];

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
      process.env.DATA_APT_KR_API_KEY = 'test-key';
      process.env.DATA_APT_KR_API_KEY2 = 'test-key2';
      process.env.DATA_STORE_API_KEY = 'test-store-key';
      process.env.DATA_GEOCODING_CLIENT_ID = 'test-geocoding-id';
      process.env.DATA_GEOCODING_CLIENT_SECRET = 'test-geocoding-secret';
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
      process.env.DATA_APT_KR_API_KEY = 'test-key';
      process.env.DATA_APT_KR_API_KEY2 = 'test-key2';
      process.env.DATA_STORE_API_KEY = 'test-store-key';
      process.env.DATA_GEOCODING_CLIENT_ID = 'test-geocoding-id';
      process.env.DATA_GEOCODING_CLIENT_SECRET = 'test-geocoding-secret';
    });

    it('정상적으로 env 객체를 export한다', () => {
      const env = require('../../src/config/env');

      expect(exitSpy).not.toHaveBeenCalled();
      expect(env).toEqual(
        expect.objectContaining({
          port: expect.any(Number),
          postgresConnectionString: expect.any(String),
          corsOrigins: expect.any(Array),
          dataAptKrApiKey: expect.any(String),
          dataAptListApiKey: expect.any(String),
          dataStoreApiKey: expect.any(String),
          dataGeocodingClientId: expect.any(String),
          dataGeocodingClientSecret: expect.any(String),
        })
      );
      expect(env.port).toBe(3000);
      expect(env.postgresConnectionString).toBe('postgresql://test');
      expect(env.corsOrigins).toContain('http://localhost:5173');
      expect(env.dataAptKrApiKey).toBe('test-key');
      expect(env.dataAptListApiKey).toBe('test-key2');
      expect(env.dataStoreApiKey).toBe('test-store-key');
      expect(env.dataGeocodingClientId).toBe('test-geocoding-id');
      expect(env.dataGeocodingClientSecret).toBe('test-geocoding-secret');
    });
  });
});
