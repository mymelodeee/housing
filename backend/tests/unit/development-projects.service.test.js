jest.mock('../../src/repositories/development-projects.repository');

const developmentProjectsRepository = require('../../src/repositories/development-projects.repository');
const { getDevelopmentProjects } = require('../../src/services/development-projects.service');

describe('services/development-projects.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('등록된 개발호재가 없으면 빈 배열을 반환한다', async () => {
    developmentProjectsRepository.findProjectsForComplex.mockResolvedValue([]);

    const result = await getDevelopmentProjects(1, '41590');

    expect(result).toEqual({ complexId: 1, projects: [] });
    expect(developmentProjectsRepository.findSourcesByProjectId).not.toHaveBeenCalled();
  });

  it('프로젝트와 출처를 함께 매핑해 반환한다', async () => {
    developmentProjectsRepository.findProjectsForComplex.mockResolvedValue([
      {
        id: 1,
        project_name: 'GTX-A 동탄역',
        category: '철도',
        status: '착공',
        effective_date: new Date(2025, 10, 18),
        checked_at: new Date(2026, 8, 1),
        note: null,
      },
    ]);
    developmentProjectsRepository.findSourcesByProjectId.mockResolvedValue([
      {
        source_name: '국토교통부',
        source_url: 'https://example.test',
        source_type: '보도자료',
        source_date: new Date(2025, 10, 1),
        checked_at: new Date(2026, 8, 1),
        reliability: 'high',
        is_accessible: true,
      },
    ]);

    const result = await getDevelopmentProjects(1, '41590');

    expect(developmentProjectsRepository.findProjectsForComplex).toHaveBeenCalledWith({ complexId: 1, lawdCd: '41590' });
    expect(developmentProjectsRepository.findSourcesByProjectId).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      complexId: 1,
      projects: [
        {
          id: 1,
          projectName: 'GTX-A 동탄역',
          category: '철도',
          status: '착공',
          effectiveDate: '2025-11-18',
          checkedAt: '2026-09-01',
          note: null,
          sources: [
            {
              name: '국토교통부',
              url: 'https://example.test',
              sourceType: '보도자료',
              sourceDate: '2025-11-01',
              checkedAt: '2026-09-01',
              reliability: 'high',
              isAccessible: true,
            },
          ],
        },
      ],
    });
  });
});
