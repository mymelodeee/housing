process.env.POSTGRES_CONNECTION_STRING = process.env.TEST_POSTGRES_CONNECTION_STRING || 'postgresql://postgres:postgres@localhost:5432/housing_test';
process.env.PORT = process.env.PORT || '3000';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');

describe('comparison-sets 통합 테스트', () => {
  let dongtanId;
  let pyeongtaekId;
  let wiryeId;
  let dongtanListingIds;

  beforeAll(async () => {
    const complexesRes = await request(app).get('/api/complexes');
    const dongtan = complexesRes.body.find((c) => c.complexName === '동탄역 시범 우남퍼스트빌');
    const pyeongtaek = complexesRes.body.find((c) => c.complexName === '평택 소사벌 한라비발디');
    const wirye = complexesRes.body.find((c) => c.complexName === '위례신도시 롯데캐슬');
    dongtanId = dongtan.id;
    pyeongtaekId = pyeongtaek.id;
    wiryeId = wirye.id;

    const listingsRes = await request(app).get('/api/listings');
    dongtanListingIds = listingsRes.body.filter((l) => l.complexId === dongtanId).map((l) => l.id);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('단지 3개로 비교셋을 생성하고 상세 조회 시 priceRange가 각 단지 기준으로 나온다', async () => {
    const createRes = await request(app)
      .post('/api/comparison-sets')
      .send({ targetType: 'complex', complexIds: [dongtanId, pyeongtaekId, wiryeId] });

    expect(createRes.status).toBe(201);
    const setId = createRes.body.id;

    const detailRes = await request(app).get(`/api/comparison-sets/${setId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.complexes).toHaveLength(3);
    expect(detailRes.body.listings).toBeNull();

    const dongtanItem = detailRes.body.complexes.find((c) => c.complexId === dongtanId);
    const pyeongtaekItem = detailRes.body.complexes.find((c) => c.complexId === pyeongtaekId);
    const wiryeItem = detailRes.body.complexes.find((c) => c.complexId === wiryeId);

    expect(dongtanItem.priceRange).toMatchObject({ minPrice: 88000, maxPrice: 110000 });
    expect(pyeongtaekItem.priceRange).toMatchObject({ minPrice: 105000, maxPrice: 105000, avgPrice: 105000 });
    expect(wiryeItem.priceRange).toBe('매물 없음');
  });

  it('대상이 1개면 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/comparison-sets')
      .send({ targetType: 'complex', complexIds: [dongtanId] });

    expect(res.status).toBe(400);
  });

  it('대상이 6개면 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/comparison-sets')
      .send({ targetType: 'complex', complexIds: [1, 2, 3, 4, 5, 6] });

    expect(res.status).toBe(400);
  });

  it('단지 비교셋에 동일 단지를 중복 추가하면 409를 반환한다', async () => {
    const createRes = await request(app)
      .post('/api/comparison-sets')
      .send({ targetType: 'complex', complexIds: [dongtanId, pyeongtaekId] });

    expect(createRes.status).toBe(201);
    const setId = createRes.body.id;

    const dupRes = await request(app)
      .post(`/api/comparison-sets/${setId}/complexes`)
      .send({ complexId: dongtanId });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body).toEqual({ message: '중복입니다' });
  });

  it('동일 단지의 매물 2개를 비교하면 두 매물의 단지 축이 서로 동일하다', async () => {
    expect(dongtanListingIds.length).toBeGreaterThanOrEqual(2);
    const [listingIdA, listingIdB] = dongtanListingIds;

    const createRes = await request(app)
      .post('/api/comparison-sets')
      .send({ targetType: 'listing', listingIds: [listingIdA, listingIdB] });

    expect(createRes.status).toBe(201);
    const setId = createRes.body.id;

    const detailRes = await request(app).get(`/api/comparison-sets/${setId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.complexes).toBeNull();
    expect(detailRes.body.listings).toHaveLength(2);

    const [first, second] = detailRes.body.listings;
    expect(first.complexName).toBe(second.complexName);
    expect(first.completionYear).toBe(second.completionYear);
    expect(first.remodelingStatus).toBe(second.remodelingStatus);
    expect(first.reconstructionStatus).toBe(second.reconstructionStatus);
    expect(first.shuttleCommuteMinutes).toBe(second.shuttleCommuteMinutes);
    expect(first.complexName).toBe('동탄역 시범 우남퍼스트빌');
  });

  it('존재하지 않는 비교셋을 조회하면 404를 반환한다', async () => {
    const res = await request(app).get('/api/comparison-sets/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  it('매물 비교셋에 매물을 추가하면 201, 동일 매물을 재추가하면 409를 반환한다', async () => {
    expect(dongtanListingIds.length).toBeGreaterThanOrEqual(3);
    const [listingIdA, listingIdB, listingIdC] = dongtanListingIds;

    const createRes = await request(app)
      .post('/api/comparison-sets')
      .send({ targetType: 'listing', listingIds: [listingIdA, listingIdB] });

    expect(createRes.status).toBe(201);
    const setId = createRes.body.id;

    const addRes = await request(app)
      .post(`/api/comparison-sets/${setId}/listings`)
      .send({ listingId: listingIdC });

    expect(addRes.status).toBe(201);
    expect(addRes.body.listings).toHaveLength(3);

    const dupRes = await request(app)
      .post(`/api/comparison-sets/${setId}/listings`)
      .send({ listingId: listingIdC });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body).toEqual({ message: '중복입니다' });
  });
});
