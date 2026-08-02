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

describe('GET /api/complexes', () => {
  let dongtanId;
  let pyeongtaekId;
  let wiryeId;

  beforeAll(async () => {
    storeInfoApiRepository.fetchStoresInRadius.mockResolvedValue({
      header: { resultCode: '03', resultMsg: 'NODATA_ERROR' },
      body: {},
    });

    const res = await request(app).get('/api/complexes');
    const findIdByName = (name) =>
      res.body.find((item) => item.complexName === name)?.id;

    dongtanId = findIdByName('동탄역 시범 우남퍼스트빌');
    pyeongtaekId = findIdByName('평택 소사벌 한라비발디');
    wiryeId = findIdByName('위례신도시 롯데캐슬');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('200과 단지 3개의 배열을 반환하며 요약 스키마에는 priceRange/latitude가 없다', async () => {
    const res = await request(app).get('/api/complexes');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
    res.body.forEach((item) => {
      expect(item).not.toHaveProperty('priceRange');
      expect(item).not.toHaveProperty('latitude');
    });
  });

  it('동탄역 단지 상세 조회 시 priceRange, 셔틀 정보, 토허구역 여부가 올바르다', async () => {
    const res = await request(app).get(`/api/complexes/${dongtanId}`);

    expect(res.status).toBe(200);
    expect(res.body.priceRange).toEqual({
      minPrice: 88000,
      maxPrice: 110000,
      avgPrice: 97667,
    });
    expect(res.body.nearestShuttleStopName).not.toBeNull();
    expect(res.body.nearestShuttleStopDistance).not.toBeNull();
    expect(res.body.shuttleCommuteMinutes).not.toBeNull();
    expect(res.body.isLandTransactionPermissionZone).toBe(true);
  });

  it('평택 단지 상세 조회 시 priceRange, 셔틀 정보(전부 null), 토허구역("확인필요")이 올바르다', async () => {
    const res = await request(app).get(`/api/complexes/${pyeongtaekId}`);

    expect(res.status).toBe(200);
    expect(res.body.priceRange).toEqual({
      minPrice: 105000,
      maxPrice: 105000,
      avgPrice: 105000,
    });
    expect(res.body.nearestShuttleStopName).toBeNull();
    expect(res.body.nearestShuttleStopDistance).toBeNull();
    expect(res.body.shuttleCommuteMinutes).toBeNull();
    expect(res.body.isLandTransactionPermissionZone).toBe('확인필요');
  });

  it('위례 단지 상세 조회 시 priceRange가 문자열 "매물 없음"이다', async () => {
    const res = await request(app).get(`/api/complexes/${wiryeId}`);

    expect(res.status).toBe(200);
    expect(res.body.priceRange).toBe('매물 없음');
  });

  it('존재하지 않는 id 조회 시 404와 { message }를 응답한다', async () => {
    const res = await request(app).get('/api/complexes/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: expect.any(String) });
  });
});
