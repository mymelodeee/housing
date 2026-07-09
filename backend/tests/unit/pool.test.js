jest.mock('../../src/config/env', () => ({
  port: 3000,
  postgresConnectionString: 'postgresql://test',
  corsOrigins: ['http://localhost:5173'],
}));

jest.mock('pg', () => {
  const mPool = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  }));
  return {
    Pool: mPool,
    types: {
      builtins: { NUMERIC: 1700 },
      setTypeParser: jest.fn(),
    },
  };
});

describe('db/pool', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('env.postgresConnectionString만으로 Pool을 생성한다', () => {
    const { Pool } = require('pg');
    const env = require('../../src/config/env');

    require('../../src/db/pool');

    expect(Pool).toHaveBeenCalledTimes(1);
    const options = Pool.mock.calls[0][0];

    expect(options).toEqual({ connectionString: env.postgresConnectionString });
    expect(options).not.toHaveProperty('host');
    expect(options).not.toHaveProperty('user');
    expect(options).not.toHaveProperty('password');
  });

  it('pool.on("error", ...) 핸들러를 등록한다', () => {
    const pool = require('../../src/db/pool');

    expect(pool.on).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
