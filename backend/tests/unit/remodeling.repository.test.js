jest.mock('../../src/db/pool', () => ({ query: jest.fn() }));

const pool = require('../../src/db/pool');
const repository = require('../../src/repositories/remodeling.repository');

function mockRows(rows) {
  pool.query.mockResolvedValue({ rows });
}

function lastSql() {
  return pool.query.mock.calls[pool.query.mock.calls.length - 1][0];
}

function lastParams() {
  return pool.query.mock.calls[pool.query.mock.calls.length - 1][1];
}

describe('repositories/remodeling.repository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('조회', () => {
    it('findProjectByLawdCdAndName은 공백/괄호/하이픈을 제거해 단지명을 비교한다', async () => {
      mockRows([{ id: 1 }]);

      const result = await repository.findProjectByLawdCdAndName({ lawdCd: '41465', complexName: '샘플 단지A' });

      expect(lastSql()).toContain('regexp_replace');
      expect(lastParams()).toEqual(['41465', '샘플 단지A']);
      expect(result).toEqual({ id: 1 });
    });

    it('findProjectByLawdCdAndName은 결과가 없으면 null을 반환한다', async () => {
      mockRows([]);

      expect(await repository.findProjectByLawdCdAndName({ lawdCd: '41465', complexName: '없음' })).toBeNull();
    });

    it('findProjectByComplexId는 complex_id로 조회하고 없으면 null이다', async () => {
      mockRows([]);

      expect(await repository.findProjectByComplexId(5)).toBeNull();
      expect(lastParams()).toEqual([5]);
    });

    it('findCurrentFacts는 is_current인 행만 출처와 함께 조회한다', async () => {
      mockRows([{ id: 1 }]);

      await repository.findCurrentFacts(100);

      expect(lastSql()).toContain('f.is_current');
      expect(lastSql()).toContain('LEFT JOIN remodeling_sources');
      expect(lastParams()).toEqual([100]);
    });

    it('findFactHistory는 is_current가 아닌 행을 superseded_at 내림차순으로 조회한다', async () => {
      mockRows([]);

      await repository.findFactHistory(100);

      expect(lastSql()).toContain('NOT f.is_current');
      expect(lastSql()).toContain('ORDER BY f.superseded_at DESC');
    });

    it('findStageHistory / findSources는 project_id로 조회한다', async () => {
      mockRows([{ id: 1 }]);
      await repository.findStageHistory(100);
      expect(lastParams()).toEqual([100]);

      mockRows([{ id: 2 }]);
      const sources = await repository.findSources(100);
      expect(sources).toEqual([{ id: 2 }]);
    });

    it('findUnlinkedProjects는 complex_id가 NULL인 사업을 반환한다', async () => {
      mockRows([{ id: 1, complex_id: null }]);

      const result = await repository.findUnlinkedProjects();

      expect(lastSql()).toContain('complex_id IS NULL');
      expect(result).toHaveLength(1);
    });
  });

  describe('재조사 대상 조회', () => {
    it.each([
      ['findStaleFacts', 'remodeling_facts'],
      ['findStaleStageHistory', 'remodeling_project_history'],
      ['findStaleSources', 'remodeling_sources'],
    ])('%s는 checked_at이 기준일보다 오래된 행만 days_since_checked와 함께 조회한다', async (fnName, table) => {
      mockRows([]);

      await repository[fnName]({ staleAfterDays: 30 });

      expect(lastSql()).toContain(table);
      expect(lastSql()).toContain('days_since_checked');
      expect(lastSql()).toContain("CURRENT_DATE - ($1 || ' days')::interval");
      expect(lastParams()).toEqual([30]);
    });
  });

  describe('upsert', () => {
    it('upsertProject는 (lawd_cd, complex_name) 충돌 시 갱신하고 updated_at을 갱신한다', async () => {
      mockRows([{ id: 100 }]);

      const result = await repository.upsertProject({
        lawdCd: '41465',
        complexName: '샘플단지A',
        lastCheckedAt: '2026-09-07',
      });

      expect(lastSql()).toContain('ON CONFLICT (lawd_cd, complex_name) DO UPDATE');
      expect(lastSql()).toContain('updated_at = now()');
      expect(lastParams()).toEqual([null, '41465', '샘플단지A', null, null, null, '2026-09-07', null]);
      expect(result).toEqual({ id: 100 });
    });

    it('upsertSource는 기존 행이 있으면 UPDATE한다', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 7 }] })
        .mockResolvedValueOnce({ rows: [{ id: 7, reliability: 'high' }] });

      const result = await repository.upsertSource({
        projectId: 100,
        sourceName: '용인시 고시',
        sourceType: '고시',
        checkedAt: '2026-09-07',
        reliability: 'high',
      });

      expect(lastSql()).toContain('UPDATE remodeling_sources');
      expect(result).toEqual({ id: 7, reliability: 'high' });
    });

    it('upsertSource는 기존 행이 없으면 INSERT한다', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 8 }] });

      const result = await repository.upsertSource({
        projectId: 100,
        sourceUrl: 'https://example.test',
        sourceType: '기타',
        checkedAt: '2026-09-07',
        reliability: 'low',
      });

      expect(lastSql()).toContain('INSERT INTO remodeling_sources');
      expect(result).toEqual({ id: 8 });
    });

    it('upsertStageHistory는 (project_id, stage) 충돌 시 갱신한다', async () => {
      mockRows([{ id: 21 }]);

      await repository.upsertStageHistory({
        projectId: 100,
        stage: '조합설립인가',
        status: 'confirmed',
        checkedAt: '2026-09-07',
      });

      expect(lastSql()).toContain('ON CONFLICT (project_id, stage) DO UPDATE');
    });
  });

  describe('쓰기', () => {
    it('insertFact는 값과 출처를 새 행으로 저장한다', async () => {
      mockRows([{ id: 31 }]);

      const result = await repository.insertFact({
        projectId: 100,
        fieldName: 'current_stage',
        value: '안전진단',
        valueStatus: 'confirmed',
        checkedAt: '2026-09-07',
      });

      expect(lastSql()).toContain('INSERT INTO remodeling_facts');
      expect(result).toEqual({ id: 31 });
    });

    it('supersedeFact는 is_current를 false로 내리고 superseded_at을 기록한다', async () => {
      mockRows([{ id: 11 }]);

      await repository.supersedeFact(11);

      expect(lastSql()).toContain('is_current = false');
      expect(lastSql()).toContain('superseded_at = now()');
    });

    it('touchFactCheckedAt은 checked_at만 갱신한다', async () => {
      mockRows([{ id: 11 }]);

      await repository.touchFactCheckedAt(11, '2026-09-07');

      expect(lastSql()).toContain('SET checked_at = $2');
      expect(lastParams()).toEqual([11, '2026-09-07']);
    });

    it('markFactConflicted는 is_conflicted만 true로 표시한다', async () => {
      mockRows([{ id: 11 }]);

      await repository.markFactConflicted(11);

      expect(lastSql()).toContain('is_conflicted = true');
    });

    it('markSourceInaccessible은 행을 지우지 않고 is_accessible=false로 표시한다', async () => {
      mockRows([{ id: 7 }]);

      await repository.markSourceInaccessible(7, '2026-09-07');

      expect(lastSql()).toContain('is_accessible = false');
      expect(lastSql()).not.toContain('DELETE');
    });

    it('linkProjectToComplex는 사업을 단지에 연결한다', async () => {
      mockRows([{ id: 100, complex_id: 5 }]);

      const result = await repository.linkProjectToComplex(100, 5);

      expect(lastParams()).toEqual([100, 5]);
      expect(result).toEqual({ id: 100, complex_id: 5 });
    });

    it('갱신 대상이 없으면 null을 반환한다', async () => {
      mockRows([]);

      expect(await repository.supersedeFact(999)).toBeNull();
      mockRows([]);
      expect(await repository.touchFactCheckedAt(999, '2026-09-07')).toBeNull();
      mockRows([]);
      expect(await repository.markFactConflicted(999)).toBeNull();
      mockRows([]);
      expect(await repository.markSourceInaccessible(999, '2026-09-07')).toBeNull();
      mockRows([]);
      expect(await repository.linkProjectToComplex(999, 5)).toBeNull();
    });
  });
});
