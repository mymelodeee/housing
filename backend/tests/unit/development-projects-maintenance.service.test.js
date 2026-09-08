jest.mock('../../src/repositories/development-projects.repository');

const repository = require('../../src/repositories/development-projects.repository');
const {
  validateEntry,
  refreshCuratedProject,
  listStaleProjects,
} = require('../../src/services/development-projects-maintenance.service');

function makeEntry(overrides = {}) {
  return {
    lawdCd: '41597',
    regionName: '화성시 동탄',
    projectName: 'GTX-A 동탄역',
    category: '철도',
    status: '완료',
    effectiveDate: '2024-03-30',
    checkedAt: '2026-09-08',
    confidence: 'high',
    note: null,
    sources: [{
      sourceName: '국토교통부',
      sourceUrl: 'https://example.test/official',
      sourceType: '보도자료',
      sourceDate: '2024-03-29',
      reliability: 'high',
    }],
    ...overrides,
  };
}

describe('services/development-projects-maintenance.service', () => {
  afterEach(() => jest.clearAllMocks());

  it('출처 추적 필드가 누락된 curated entry를 거부한다', () => {
    const entry = makeEntry();
    delete entry.sources[0].sourceDate;
    expect(() => validateEntry(entry)).toThrow('sourceDate');
  });

  it('동일 값은 history 없이 checked_at과 출처만 갱신한다', async () => {
    repository.findProjectByLawdCdAndName.mockResolvedValue({
      id: 1,
      region_name: '화성시 동탄',
      category: '철도',
      status: '완료',
      effective_date: new Date('2024-03-30'),
      confidence: 'high',
      note: null,
    });
    repository.touchProjectVerification.mockResolvedValue({ id: 1 });
    repository.upsertSource.mockResolvedValue({ id: 10 });

    const result = await refreshCuratedProject(makeEntry());

    expect(result.action).toBe('verified');
    expect(repository.replaceProjectWithHistory).not.toHaveBeenCalled();
    expect(repository.touchProjectVerification).toHaveBeenCalledWith({ projectId: 1, checkedAt: '2026-09-08', confidence: 'high' });
    expect(repository.upsertSource).toHaveBeenCalledWith(expect.objectContaining({ projectId: 1, checkedAt: '2026-09-08' }));
  });

  it('값이 바뀌면 이전 snapshot을 남기는 repository 경로를 사용한다', async () => {
    repository.findProjectByLawdCdAndName.mockResolvedValue({
      id: 1,
      region_name: '화성시 동탄',
      category: '철도',
      status: '공사중',
      effective_date: new Date('2024-01-01'),
      confidence: 'high',
      note: null,
    });
    repository.replaceProjectWithHistory.mockResolvedValue({ id: 1, status: '완료' });
    repository.upsertSource.mockResolvedValue({ id: 10 });

    const result = await refreshCuratedProject(makeEntry());

    expect(result.action).toBe('updated');
    expect(repository.replaceProjectWithHistory).toHaveBeenCalledWith(expect.objectContaining({ projectId: 1, status: '완료' }));
  });

  it('출처 충돌 표시가 있으면 current 값을 덮어쓰지 않는다', async () => {
    repository.findProjectByLawdCdAndName.mockResolvedValue({ id: 1 });
    repository.markProjectConflict.mockResolvedValue({ id: 1, is_conflicted: true });
    repository.upsertSource.mockResolvedValue({ id: 11 });

    const result = await refreshCuratedProject(makeEntry({ hasConflict: true }));

    expect(result.action).toBe('conflicted');
    expect(repository.replaceProjectWithHistory).not.toHaveBeenCalled();
    expect(repository.markProjectConflict).toHaveBeenCalledWith({ projectId: 1, checkedAt: '2026-09-08' });
  });

  it('stale 기준일 조회를 repository에 위임한다', async () => {
    repository.findStaleProjects.mockResolvedValue([{ id: 1 }]);
    await expect(listStaleProjects(45)).resolves.toEqual([{ id: 1 }]);
    expect(repository.findStaleProjects).toHaveBeenCalledWith(45);
  });
});
