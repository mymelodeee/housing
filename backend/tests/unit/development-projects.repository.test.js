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

  it('findProjectsForComplex는 complex_id 직접 연결 또는 같은 lawd_cd의 미연결 사업을 조회한다', async () => {
    mockRows([{ id: 1, complex_id: 5 }]);

    const result = await repository.findProjectsForComplex({ complexId: 5, lawdCd: '41465' });

    expect(lastSql()).toContain('FROM development_projects');
    expect(lastSql()).toContain('complex_id IS NULL AND lawd_cd = $2');
    expect(lastParams()).toEqual([5, '41465']);
    expect(result).toEqual([{ id: 1, complex_id: 5 }]);
  });

  it('findSourcesByProjectId는 project_id로 출처를 조회한다', async () => {
    mockRows([{ id: 10, project_id: 1 }]);

    const result = await repository.findSourcesByProjectId(1);

    expect(lastSql()).toContain('FROM development_project_sources');
    expect(lastParams()).toEqual([1]);
    expect(result).toEqual([{ id: 10, project_id: 1 }]);
  });

  it('findProjectByLawdCdAndName은 lawd_cd와 project_name이 모두 일치하는 행만 조회한다', async () => {
    mockRows([{ id: 1 }]);

    const result = await repository.findProjectByLawdCdAndName('41597', 'GTX-A 동탄역');

    expect(lastParams()).toEqual(['41597', 'GTX-A 동탄역']);
    expect(result).toEqual({ id: 1 });
  });

  it('findProjectByLawdCdAndName은 일치하는 행이 없으면 null을 반환한다', async () => {
    mockRows([]);
    expect(await repository.findProjectByLawdCdAndName('41597', '없는사업')).toBeNull();
  });

  it('insertProject는 개발호재 행을 생성한다', async () => {
    mockRows([{ id: 1, project_name: 'GTX-A 동탄역' }]);

    const result = await repository.insertProject({
      lawdCd: '41590',
      regionName: '화성시',
      projectName: 'GTX-A 동탄역',
      category: '철도',
      status: '착공',
      effectiveDate: '2025-11-18',
      checkedAt: '2026-09-08',
      confidence: 'high',
      note: null
    });

    expect(lastSql()).toContain('INSERT INTO development_projects');
    expect(lastParams()).toEqual([null, '41590', '화성시', 'GTX-A 동탄역', '철도', '착공', '2025-11-18', '2026-09-08', 'high', null]);
    expect(result).toEqual({ id: 1, project_name: 'GTX-A 동탄역' });
  });

  it('findStaleProjects는 기준 일수를 SQL 파라미터로 전달한다', async () => {
    mockRows([{ id: 1 }]);
    await expect(repository.findStaleProjects(30)).resolves.toEqual([{ id: 1 }]);
    expect(lastSql()).toContain('checked_at < CURRENT_DATE - $1::integer');
    expect(lastParams()).toEqual([30]);
  });

  it('replaceProjectWithHistory는 이전 값과 출처 snapshot을 보존한 뒤 current를 갱신한다', async () => {
    mockRows([{ id: 1, status: '완료' }]);
    await repository.replaceProjectWithHistory({
      projectId: 1,
      regionName: '화성시',
      category: '철도',
      status: '완료',
      effectiveDate: '2024-03-30',
      checkedAt: '2026-09-08',
      confidence: 'high',
      note: null,
    });
    expect(lastSql()).toContain('INSERT INTO development_project_history');
    expect(lastSql()).toContain('sources_snapshot');
    expect(lastParams()).toEqual([1, '화성시', '철도', '완료', '2024-03-30', '2026-09-08', 'high', null]);
  });

  it('insertSource는 출처 행을 생성한다', async () => {
    mockRows([{ id: 1 }]);

    const result = await repository.insertSource({
      projectId: 1,
      sourceUrl: 'https://example.test',
      sourceName: '국토교통부',
      sourceType: '보도자료',
      sourceDate: '2025-11-01',
      checkedAt: '2026-09-08',
      reliability: 'high'
    });

    expect(lastSql()).toContain('INSERT INTO development_project_sources');
    expect(result).toEqual({ id: 1 });
  });
});
