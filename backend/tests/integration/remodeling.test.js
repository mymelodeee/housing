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

describe('리모델링 추진 정보 API', () => {
  let dongtanListingId;
  let dongtanComplexId;
  let pyeongtaekListingId;

  beforeAll(async () => {
    // 평택(41220)은 TARGET_REGIONS 비대상 지역이라 GET /api/listings 목록에서 제외되므로
    // (docs/search-architecture-refactor-plan.md §2) DB에서 직접 listing id를 조회한다.
    const res = await request(app).get('/api/listings');
    const dongtan = res.body.find((item) => item.complex.complexName === '동탄역 시범 우남퍼스트빌');

    dongtanListingId = dongtan.id;
    dongtanComplexId = dongtan.complex.id;

    const pyeongtaekRow = await pool.query(
      `SELECT l.id FROM listings l
       JOIN apartment_complexes c ON c.id = l.complex_id
       WHERE c.complex_name = '평택 소사벌 한라비발디' LIMIT 1`
    );
    pyeongtaekListingId = pyeongtaekRow.rows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/listings/:id/remodeling', () => {
    it('리모델링 사업이 있는 단지의 매물 조회 시 200과 계약된 필드 전체를 반환한다', async () => {
      const res = await request(app).get(`/api/listings/${dongtanListingId}/remodeling`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        listingId: dongtanListingId,
        complexId: dongtanComplexId,
        hasProject: true,
        projectName: '동탄역 시범 우남퍼스트빌 리모델링주택조합',
        complexName: '동탄역 시범 우남퍼스트빌',
        staleAfterDays: 30,
      });
    });

    it('현재 단계는 effectiveDate(사실 발생일)와 checkedAt(마지막 검증일)을 분리해 반환하고 출처가 붙는다', async () => {
      const res = await request(app).get(`/api/listings/${dongtanListingId}/remodeling`);

      expect(res.body.currentStage).toMatchObject({
        value: '사업계획승인',
        status: 'confirmed',
        effectiveDate: '2025-11-18',
        daysSinceChecked: 0,
        isStale: false,
        isConflicted: false,
      });
      expect(res.body.currentStage.source).toEqual({
        name: '화성시 고시',
        url: 'https://example.test/notice/1',
        sourceDate: '2025-11-18',
        reliability: 'high',
      });
    });

    it('세대수 증가분은 저장값이 아니라 after - before로 계산되어 반환된다', async () => {
      const res = await request(app).get(`/api/listings/${dongtanListingId}/remodeling`);

      expect(res.body.households).toMatchObject({ before: 1234, after: 1418, increase: 184 });
    });

    it('200일 전에 확인한 분담금은 isStale true와 daysSinceChecked로 재조사 대상임이 드러난다', async () => {
      const res = await request(app).get(`/api/listings/${dongtanListingId}/remodeling`);

      expect(res.body.contributions).toHaveLength(1);
      expect(res.body.contributions[0]).toMatchObject({
        unitType: '84A',
        amount: 25000,
        unit: '만원',
        status: 'estimated',
        effectiveDate: '2026-03-01',
        isStale: true,
      });
      expect(res.body.contributions[0].daysSinceChecked).toBe(200);
    });

    it('출처가 없는 값(loanStatus)은 source가 null이다', async () => {
      const res = await request(app).get(`/api/listings/${dongtanListingId}/remodeling`);

      expect(res.body.loanStatus).toMatchObject({ value: '이주비 대출 미확정', status: 'unknown', effectiveDate: null });
      expect(res.body.loanStatus.source).toBeNull();
    });

    it('단계 이력은 진행 순서대로 반환된다', async () => {
      const res = await request(app).get(`/api/listings/${dongtanListingId}/remodeling`);

      expect(res.body.stageHistory.map((item) => item.stage)).toEqual(['조합설립인가', '사업계획승인']);
      expect(res.body.stageHistory[0].effectiveDate).toBe('2021-06-30');
    });

    it('priceLink는 매매가 변동 이력의 최신 실거래가와 대표 분담금을 합산한 총비용을 포함한다', async () => {
      const res = await request(app).get(`/api/listings/${dongtanListingId}/remodeling`);

      expect(res.body.priceLink).toEqual({
        recentTransactionPrice: 95000,
        recentTransactionDate: '2024-11-02',
        estimatedTotalCost: 120000,
        note: '실거래가는 매매가 변동 이력 탭 기준',
      });
    });

    it('리모델링 사업이 없는 단지의 매물은 200과 hasProject false를 반환한다', async () => {
      const res = await request(app).get(`/api/listings/${pyeongtaekListingId}/remodeling`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        listingId: pyeongtaekListingId,
        complexId: expect.any(Number),
        hasProject: false,
        message: '리모델링 추진 정보 없음',
      });
    });

    it('존재하지 않는 id 조회 시 404와 { message }를 응답한다', async () => {
      const res = await request(app).get('/api/listings/999999/remodeling');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: expect.any(String) });
    });
  });

  describe('GET /api/admin/remodeling/stale', () => {
    it('기본 기준일(30일)로 조회 시 200과 재조사 대상 목록을 반환한다', async () => {
      const res = await request(app).get('/api/admin/remodeling/stale');

      expect(res.status).toBe(200);
      expect(res.body.staleAfterDays).toBe(30);
      expect(res.body.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(res.body.facts)).toBe(true);
      expect(res.body.totalCount).toBe(
        res.body.facts.length + res.body.stageHistory.length + res.body.sources.length
      );

      const staleContribution = res.body.facts.find((item) => item.fieldName === 'contribution_amount');
      expect(staleContribution).toMatchObject({
        complexName: '동탄역 시범 우남퍼스트빌',
        lawdCd: '41597',
        fieldKey: '84A',
        value: '25000',
        valueStatus: 'estimated',
        daysSinceChecked: 200,
        isStale: true,
        sourceName: '화성시 고시',
        reliability: 'high',
      });
    });

    it('staleAfterDays=365면 200일 전 항목은 재조사 대상에서 빠진다', async () => {
      const res = await request(app).get('/api/admin/remodeling/stale').query({ staleAfterDays: 365 });

      expect(res.status).toBe(200);
      expect(res.body.staleAfterDays).toBe(365);
      expect(res.body.totalCount).toBe(0);
    });

    it('staleAfterDays가 숫자가 아니면 400과 { message }를 응답한다', async () => {
      const res = await request(app).get('/api/admin/remodeling/stale').query({ staleAfterDays: 'abc' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: expect.any(String) });
    });
  });
});
