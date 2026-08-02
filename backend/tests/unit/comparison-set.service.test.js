jest.mock('../../src/repositories/comparison-sets.repository');
jest.mock('../../src/services/comparison.service');

const comparisonSetsRepository = require('../../src/repositories/comparison-sets.repository');
const comparisonService = require('../../src/services/comparison.service');
const comparisonSetService = require('../../src/services/comparison-set.service');

describe('comparison-set.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateMemberCount', () => {
    it('1개면 오류 메시지를 반환한다', () => {
      const result = comparisonSetService.validateMemberCount([1]);
      expect(result).toBe('비교하려면 2개 이상 선택해야 합니다');
    });

    it('2개면 통과한다', () => {
      const result = comparisonSetService.validateMemberCount([1, 2]);
      expect(result).toBeNull();
    });

    it('5개면 통과한다', () => {
      const result = comparisonSetService.validateMemberCount([1, 2, 3, 4, 5]);
      expect(result).toBeNull();
    });

    it('6개면 오류 메시지를 반환한다', () => {
      const result = comparisonSetService.validateMemberCount([1, 2, 3, 4, 5, 6]);
      expect(result).toBe('비교셋은 최대 5개까지 선택할 수 있습니다');
    });
  });

  describe('listComparisonSets', () => {
    it('repository 결과를 요약 형태로 매핑해 반환한다', async () => {
      comparisonSetsRepository.findSetsByUserProfileId.mockResolvedValue([
        {
          id: 1,
          target_type: 'complex',
          created_at: '2026-01-01',
          item_count: 2,
          item_names: ['단지1', '단지2']
        }
      ]);

      const result = await comparisonSetService.listComparisonSets();

      expect(comparisonSetsRepository.findSetsByUserProfileId).toHaveBeenCalledWith(1);
      expect(result).toEqual([
        { id: 1, targetType: 'complex', createdAt: '2026-01-01', itemCount: 2, itemNames: ['단지1', '단지2'] }
      ]);
    });

    it('비교셋이 없으면 빈 배열을 반환한다', async () => {
      comparisonSetsRepository.findSetsByUserProfileId.mockResolvedValue([]);

      const result = await comparisonSetService.listComparisonSets();

      expect(result).toEqual([]);
    });
  });

  describe('createComparisonSet', () => {
    it('대상이 2개 미만이면 repository를 호출하지 않고 status 400 에러를 던진다', async () => {
      await expect(
        comparisonSetService.createComparisonSet({ targetType: 'complex', complexIds: [1] })
      ).rejects.toMatchObject({ status: 400, message: '비교하려면 2개 이상 선택해야 합니다' });

      expect(comparisonSetsRepository.createSetWithMembers).not.toHaveBeenCalled();
    });

    it('대상이 5개 초과이면 repository를 호출하지 않고 status 400 에러를 던진다', async () => {
      await expect(
        comparisonSetService.createComparisonSet({ targetType: 'complex', complexIds: [1, 2, 3, 4, 5, 6] })
      ).rejects.toMatchObject({ status: 400, message: '비교셋은 최대 5개까지 선택할 수 있습니다' });

      expect(comparisonSetsRepository.createSetWithMembers).not.toHaveBeenCalled();
    });

    it('유효한 개수이면 repository와 comparisonService를 호출해 결과를 반환한다', async () => {
      comparisonSetsRepository.createSetWithMembers.mockResolvedValue({ id: 10 });
      comparisonService.getComparisonSetDetail.mockResolvedValue({ id: 10, complexes: [] });

      const result = await comparisonSetService.createComparisonSet({
        targetType: 'complex',
        complexIds: [1, 2]
      });

      expect(comparisonSetsRepository.createSetWithMembers).toHaveBeenCalledWith(1, 'complex', [1, 2]);
      expect(comparisonService.getComparisonSetDetail).toHaveBeenCalledWith(10);
      expect(result).toEqual({ id: 10, complexes: [] });
    });
  });
});
