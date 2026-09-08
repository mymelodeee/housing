jest.mock('../../src/db/pool', () => ({ query: jest.fn() }));

const pool = require('../../src/db/pool');
const repository = require('../../src/repositories/development-projects.repository');

function mockRows(rows) {
  pool.query.mockResolvedValue({ rows });
}

function lastSql() {
  return pool.query.mock.calls[pool.query.mock.calls.length - 1][0];
}

function lastParams() {
  return pool.query.mock.calls[pool.query.mock.calls.length - 1][1];
}

describe('repositories/development-projects.repository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findProjectsByComplexId는 complex_id로 조회한다', async () => {
    mockRows([{ id: 1, complex_id: 5 }]);

    const result = await repository.findProjectsByComplexId(5);

    expect(lastSql()).toContain('FROM development_projects');
    expect(lastParams()).toEqual([5]);
    expect(result).toEqual([{ id: 1, complex_id: 5 }]);
  });

  it('findSourcesByProjectId는 project_id로 출처를 조회한다', async () => {
    mockRows([{ id: 10, project_id: 1 }]);

    const result = await repository.findSourcesByProjectId(1);

    expect(lastSql()).toContain('FROM development_project_sources');
    expect(lastParams()).toEqual([1]);
    expect(result).toEqual([{ id: 10, project_id: 1 }]);
  });
});
