process.env.POSTGRES_CONNECTION_STRING =
  process.env.TEST_POSTGRES_CONNECTION_STRING ||
  'postgresql://postgres:postgres@localhost:5432/housing_test';
process.env.PORT = process.env.PORT || '3000';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.DATA_APT_KR_API_KEY = process.env.DATA_APT_KR_API_KEY || 'test-key';
process.env.DATA_STORE_API_KEY = process.env.DATA_STORE_API_KEY || 'test-key';

jest.mock('../../src/repositories/store-info-api.repository');

const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const storeInfoApiRepository = require('../../src/repositories/store-info-api.repository');

describe('market-interest-rate', () => {
  let dongtanId;

  beforeAll(async () => {
    storeInfoApiRepository.fetchStoresInRadius.mockResolvedValue({
      header: { resultCode: '03', resultMsg: 'NODATA_ERROR' },
      body: {},
    });

    const res = await request(app).get('/api/complexes');
    dongtanId = res.body.find((item) => item.complexName === '동탄역 시범 우남퍼스트빌')?.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/admin/market-interest-rate가 현재 기준금리와 출처·재조사 필요 여부를 반환한다', async () => {
    const res = await request(app).get('/api/admin/market-interest-rate');

    expect(res.status).toBe(200);
    expect(typeof res.body.ratePercent).toBe('number');
    expect(typeof res.body.referencePeriod).toBe('string');
    expect(typeof res.body.sourceName).toBe('string');
    expect(typeof res.body.checkedAt).toBe('string');
    expect(typeof res.body.daysSinceChecked).toBe('number');
    expect(typeof res.body.isStale).toBe('boolean');
    expect(typeof res.body.sourceLabel).toBe('string');
  });

  it('GET /api/complexes/:id/loan-simulation 응답에 interestRateMeta가 포함되고 scenarios의 금리와 일치한다', async () => {
    const res = await request(app).get(`/api/complexes/${dongtanId}/loan-simulation`).query({ salePrice: 95000 });

    expect(res.status).toBe(200);
    if (res.body.profileIncomplete === false && res.body.scenarios) {
      expect(res.body.interestRateMeta).toEqual(
        expect.objectContaining({
          ratePercent: expect.any(Number),
          referencePeriod: expect.any(String),
          checkedAt: expect.any(String),
          daysSinceChecked: expect.any(Number),
          isStale: expect.any(Boolean),
        })
      );
      res.body.scenarios.forEach((scenario) => {
        expect(scenario.interestRatePercent).toBe(res.body.interestRateMeta.ratePercent);
      });
    }
  });
});
