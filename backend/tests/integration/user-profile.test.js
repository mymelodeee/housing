process.env.POSTGRES_CONNECTION_STRING =
  process.env.TEST_POSTGRES_CONNECTION_STRING ||
  'postgresql://postgres:postgres@localhost:5432/housing_test';
process.env.PORT = process.env.PORT || '3000';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.DATA_APT_KR_API_KEY = process.env.DATA_APT_KR_API_KEY || 'test-key';
process.env.DATA_STORE_API_KEY = process.env.DATA_STORE_API_KEY || 'test-key';

const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');

describe('/api/user-profile', () => {
  beforeEach(async () => {
    await pool.query(
      `UPDATE user_profiles SET workplace=NULL, ownership_structure=NULL, annual_income=NULL,
        annual_bonus=NULL, available_capital=NULL, housing_ownership_tier=NULL, is_first_time_buyer=NULL
       WHERE id = 1`
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/user-profile 호출 시 200과 초기 상태(전부 null)를 반환한다', async () => {
    const res = await request(app).get('/api/user-profile');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      workplace: null,
      ownershipStructure: null,
      annualIncome: null,
      annualBonus: null,
      availableCapital: null,
      housingOwnershipTier: null,
      isFirstTimeBuyer: null,
    });
  });

  it('PUT /api/user-profile에 정상 값 전달 시 200과 반영된 결과를 반환한다', async () => {
    const payload = {
      workplace: '화성',
      ownershipStructure: '부부합산',
      annualIncome: 7000,
      annualBonus: 1000,
      availableCapital: 25000,
      housingOwnershipTier: '1주택',
      isFirstTimeBuyer: false,
    };

    const res = await request(app).put('/api/user-profile').send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, ...payload });
  });

  it('PUT /api/user-profile에 무주택이 아닌데 isFirstTimeBuyer=true 전달 시 400을 반환한다', async () => {
    const res = await request(app)
      .put('/api/user-profile')
      .send({ housingOwnershipTier: '1주택', isFirstTimeBuyer: true });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  it('PUT /api/user-profile에 workplace=서울 전달 시 400을 반환한다', async () => {
    const res = await request(app).put('/api/user-profile').send({ workplace: '서울' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: expect.any(String) });
  });
});
