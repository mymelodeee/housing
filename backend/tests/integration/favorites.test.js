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

describe('/api/favorites', () => {
  let dongtanId;
  let dongtanListingId;

  beforeAll(async () => {
    const complexesRes = await request(app).get('/api/complexes');
    dongtanId = complexesRes.body.find((item) => item.complexName === '동탄역 시범 우남퍼스트빌')?.id;

    const listingsRes = await request(app).get('/api/listings');
    dongtanListingId = listingsRes.body.find((item) => item.complex.id === dongtanId)?.id;
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM favorite_complexes');
    await pool.query('DELETE FROM favorite_listings');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('단지 즐겨찾기', () => {
    it('추가 시 201을 응답한다', async () => {
      const res = await request(app).post('/api/favorites/complexes').send({ complexId: dongtanId });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ complexId: dongtanId });
    });

    it('동일 단지 재추가 시 409와 message를 응답하고 row는 여전히 1건이다', async () => {
      await request(app).post('/api/favorites/complexes').send({ complexId: dongtanId });
      const res = await request(app).post('/api/favorites/complexes').send({ complexId: dongtanId });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ message: expect.any(String) });

      const countRes = await pool.query('SELECT COUNT(*) FROM favorite_complexes');
      expect(Number(countRes.rows[0].count)).toBe(1);
    });

    it('목록 조회 시 추가한 단지가 complex.complexName과 함께 포함된다', async () => {
      await request(app).post('/api/favorites/complexes').send({ complexId: dongtanId });

      const res = await request(app).get('/api/favorites/complexes');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        complexId: dongtanId,
        complex: expect.objectContaining({ complexName: '동탄역 시범 우남퍼스트빌' }),
      });
    });

    it('삭제 시 200을 응답하고 목록에서 사라지며, 재삭제 시 404를 응답한다', async () => {
      await request(app).post('/api/favorites/complexes').send({ complexId: dongtanId });

      const deleteRes = await request(app).delete(`/api/favorites/complexes/${dongtanId}`);
      expect(deleteRes.status).toBe(200);

      const listRes = await request(app).get('/api/favorites/complexes');
      expect(listRes.body).toEqual([]);

      const secondDeleteRes = await request(app).delete(`/api/favorites/complexes/${dongtanId}`);
      expect(secondDeleteRes.status).toBe(404);
    });
  });

  describe('매물 즐겨찾기', () => {
    it('추가 시 201을 응답한다', async () => {
      const res = await request(app).post('/api/favorites/listings').send({ listingId: dongtanListingId });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ listingId: dongtanListingId });
    });

    it('동일 매물 재추가 시 409와 message를 응답하고 row는 여전히 1건이다', async () => {
      await request(app).post('/api/favorites/listings').send({ listingId: dongtanListingId });
      const res = await request(app).post('/api/favorites/listings').send({ listingId: dongtanListingId });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ message: expect.any(String) });

      const countRes = await pool.query('SELECT COUNT(*) FROM favorite_listings');
      expect(Number(countRes.rows[0].count)).toBe(1);
    });

    it('목록 조회 시 추가한 매물이 listing.complex와 함께 포함된다', async () => {
      await request(app).post('/api/favorites/listings').send({ listingId: dongtanListingId });

      const res = await request(app).get('/api/favorites/listings');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        listingId: dongtanListingId,
        listing: expect.objectContaining({
          id: dongtanListingId,
          complexId: dongtanId,
          complex: expect.objectContaining({ id: dongtanId }),
        }),
      });
    });

    it('삭제 시 200을 응답하고 목록에서 사라지며, 재삭제 시 404를 응답한다', async () => {
      await request(app).post('/api/favorites/listings').send({ listingId: dongtanListingId });

      const deleteRes = await request(app).delete(`/api/favorites/listings/${dongtanListingId}`);
      expect(deleteRes.status).toBe(200);

      const listRes = await request(app).get('/api/favorites/listings');
      expect(listRes.body).toEqual([]);

      const secondDeleteRes = await request(app).delete(`/api/favorites/listings/${dongtanListingId}`);
      expect(secondDeleteRes.status).toBe(404);
    });
  });

  describe('단지/매물 즐겨찾기 독립성', () => {
    it('둘을 함께 추가해도 각 목록의 개수가 독립적으로 정확하다', async () => {
      await request(app).post('/api/favorites/complexes').send({ complexId: dongtanId });
      await request(app).post('/api/favorites/listings').send({ listingId: dongtanListingId });

      const complexListRes = await request(app).get('/api/favorites/complexes');
      const listingListRes = await request(app).get('/api/favorites/listings');

      expect(complexListRes.body).toHaveLength(1);
      expect(listingListRes.body).toHaveLength(1);

      await request(app).delete(`/api/favorites/complexes/${dongtanId}`);

      const complexListAfterRes = await request(app).get('/api/favorites/complexes');
      const listingListAfterRes = await request(app).get('/api/favorites/listings');

      expect(complexListAfterRes.body).toHaveLength(0);
      expect(listingListAfterRes.body).toHaveLength(1);
    });
  });
});
