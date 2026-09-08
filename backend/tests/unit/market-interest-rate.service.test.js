jest.mock('../../src/repositories/market-interest-rate.repository');

const marketInterestRateRepository = require('../../src/repositories/market-interest-rate.repository');
const { getCurrentRate, refreshCurrentRate } = require('../../src/services/market-interest-rate.service');

describe('market-interest-rate.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentRate', () => {
    it('DB에 값이 없으면 null을 반환한다', async () => {
      marketInterestRateRepository.findCurrent.mockResolvedValue(null);
      expect(await getCurrentRate()).toBeNull();
    });

    it('checked_at으로부터 30일 미만이면 isStale이 false다', async () => {
      marketInterestRateRepository.findCurrent.mockResolvedValue({
        rate_percent: '4.48',
        reference_period: '2026-07',
        source_name: '한국은행 금융기관 가중평균금리',
        source_url: 'https://www.bok.or.kr',
        checked_at: new Date('2026-09-08T00:00:00'),
      });

      const result = await getCurrentRate({ today: new Date('2026-09-20T00:00:00') });

      expect(result.ratePercent).toBe(4.48);
      expect(result.daysSinceChecked).toBe(12);
      expect(result.isStale).toBe(false);
    });

    it('checked_at으로부터 30일 이상이면 isStale이 true이고 안내 문구가 붙는다', async () => {
      marketInterestRateRepository.findCurrent.mockResolvedValue({
        rate_percent: '4.48',
        reference_period: '2026-07',
        source_name: '한국은행 금융기관 가중평균금리',
        source_url: 'https://www.bok.or.kr',
        checked_at: new Date('2026-09-08T00:00:00'),
      });

      const result = await getCurrentRate({ today: new Date('2026-10-10T00:00:00') });

      expect(result.daysSinceChecked).toBe(32);
      expect(result.isStale).toBe(true);
      expect(result.sourceLabel).toMatch(/확인 필요/);
    });

    it('staleAfterDays를 직접 지정할 수 있다', async () => {
      marketInterestRateRepository.findCurrent.mockResolvedValue({
        rate_percent: '4.48',
        reference_period: '2026-07',
        source_name: 'x',
        source_url: null,
        checked_at: new Date('2026-09-08T00:00:00'),
      });

      const result = await getCurrentRate({ today: new Date('2026-09-15T00:00:00'), staleAfterDays: 5 });

      expect(result.isStale).toBe(true);
    });
  });

  describe('refreshCurrentRate', () => {
    it('repository.updateCurrent를 그대로 호출한다', async () => {
      marketInterestRateRepository.updateCurrent.mockResolvedValue({ id: 1 });

      const params = { ratePercent: 4.5, referencePeriod: '2026-08', sourceName: 'x', sourceUrl: 'y', checkedAt: '2026-10-01' };
      await refreshCurrentRate(params);

      expect(marketInterestRateRepository.updateCurrent).toHaveBeenCalledWith(params);
    });
  });
});
