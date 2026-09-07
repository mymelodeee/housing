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

describe('GET /api/listings', () => {
  let dongtanId;
  let pyeongtaekId;
  // 평택(41220)은 TARGET_REGIONS 비대상 지역이라 GET /api/listings 목록에서 제외된다.
  // 상세/입지/실거래/규제 API는 id로 직접 조회하므로, 목록을 거치지 않고 DB에서 바로
  // listing id를 얻어 해당 API들이 지역과 무관하게(기존과 동일하게) 동작함을 검증한다.
  let pyeongtaekListingId;

  beforeAll(async () => {
    storeInfoApiRepository.fetchStoresInRadius.mockResolvedValue({
      header: { resultCode: '03', resultMsg: 'NODATA_ERROR' },
      body: {},
    });

    const res = await request(app).get('/api/complexes');
    const findIdByName = (name) => res.body.find((item) => item.complexName === name)?.id;

    dongtanId = findIdByName('동탄역 시범 우남퍼스트빌');
    pyeongtaekId = findIdByName('평택 소사벌 한라비발디');

    const pyeongtaekListingRow = await pool.query(
      'SELECT id FROM listings WHERE complex_id = $1 LIMIT 1',
      [pyeongtaekId]
    );
    pyeongtaekListingId = pyeongtaekListingRow.rows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('파라미터 없이 조회 시 200과 매물 3건(동탄, 대상 지역만)을 반환하며 각 item에 올바른 complex.id가 포함된다', async () => {
    const res = await request(app).get('/api/listings');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
    res.body.forEach((item) => {
      expect(item).toHaveProperty('complex');
      expect(item.complex.id).toBe(dongtanId);
      expect(typeof item.complex.latitude).toBe('number');
      expect(typeof item.complex.longitude).toBe('number');
    });
  });

  it('평택(41220)은 TARGET_REGIONS 비대상 지역이라 목록에서 제외된다', async () => {
    const res = await request(app).get('/api/listings');

    expect(res.status).toBe(200);
    expect(res.body.some((item) => item.complex.id === pyeongtaekId)).toBe(false);
  });

  it('city=화성시 조회 시 동탄 매물 3건만 반환한다', async () => {
    const res = await request(app).get('/api/listings').query({ city: '화성시' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    res.body.forEach((item) => expect(item.complex.id).toBe(dongtanId));
  });

  it('city=성남시 조회 시 해당 city에는 매물 fixture가 없어 빈 배열을 반환한다', async () => {
    const res = await request(app).get('/api/listings').query({ city: '성남시' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/listings/regions/cities 조회 시 200과 화성시를 포함한 시 목록을 반환한다', async () => {
    const res = await request(app).get('/api/listings/regions/cities');

    expect(res.status).toBe(200);
    expect(res.body.cities).toEqual(expect.arrayContaining(['화성시', '수원시', '성남시']));
  });

  it('minPrice=106000&maxPrice=150000 조회 시 salePrice 110000인 매물 1건만 반환한다', async () => {
    const res = await request(app).get('/api/listings').query({ minPrice: 106000, maxPrice: 150000 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].salePrice).toBe(110000);
  });

  it('minPrice=1&maxPrice=1 조회 시 빈 배열을 반환한다', async () => {
    const res = await request(app).get('/api/listings').query({ minPrice: 1, maxPrice: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('동탄 단지 매물은 셔틀 정보(nearestShuttleStopName/Distance, shuttleCommuteMinutes)가 전부 non-null이다', async () => {
    const res = await request(app).get('/api/listings');
    const dongtanListing = res.body.find((item) => item.complex.id === dongtanId);

    expect(dongtanListing.complex.nearestShuttleStopName).not.toBeNull();
    expect(dongtanListing.complex.nearestShuttleStopDistance).not.toBeNull();
    expect(dongtanListing.complex.shuttleCommuteMinutes).not.toBeNull();
  });

  it('평택 단지 매물은 (목록에서는 제외되어도) id 직접 조회 시 셔틀 정보가 전부 null이고 salePrice 105000, exclusiveArea는 정상 숫자다', async () => {
    const res = await request(app).get(`/api/listings/${pyeongtaekListingId}`);

    expect(res.status).toBe(200);
    expect(res.body.complex.nearestShuttleStopName).toBeNull();
    expect(res.body.complex.nearestShuttleStopDistance).toBeNull();
    expect(res.body.complex.shuttleCommuteMinutes).toBeNull();
    expect(res.body.salePrice).toBe(105000);
    expect(typeof res.body.exclusiveArea).toBe('number');
  });

  it('좌표 필터(동탄 좌표 포함, 평택 좌표 제외 범위) 적용 시 동탄 매물 3건만 반환한다', async () => {
    const res = await request(app).get('/api/listings').query({
      minLat: 37.0,
      maxLat: 37.3,
      minLng: 127.0,
      maxLng: 127.2,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    res.body.forEach((item) => {
      expect(item.complex.id).toBe(dongtanId);
    });
  });

  it('GET /api/listings/:id로 동탄 매물 단건 조회 시 200과 Listing 스키마 전체 필드를 반환한다', async () => {
    const listRes = await request(app).get('/api/listings');
    const dongtanListing = listRes.body.find((item) => item.complex.id === dongtanId);

    const res = await request(app).get(`/api/listings/${dongtanListing.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', dongtanListing.id);
    expect(res.body).toHaveProperty('complexId', dongtanId);
    expect(res.body).toHaveProperty('salePrice');
    expect(res.body).toHaveProperty('exclusiveArea');
    expect(res.body).toHaveProperty('complex');
  });

  it('존재하지 않는 id 조회 시 404와 { message }를 응답한다', async () => {
    const res = await request(app).get('/api/listings/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  describe('GET /api/listings/:id/locality', () => {
    it('동탄 매물 조회 시 200과 fixture의 locality_attributes(교통/학군)가 반영된 입지 정보를 반환한다', async () => {
      const listRes = await request(app).get('/api/listings');
      const dongtanListing = listRes.body.find((item) => item.complex.id === dongtanId);

      const res = await request(app).get(`/api/listings/${dongtanListing.id}/locality`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        listingId: dongtanListing.id,
        complexId: dongtanId,
        completionYear: 1998,
        remodelingStatus: '해당없음',
        reconstructionStatus: '해당없음',
        nearbyRedevelopmentInfo: null,
      });
      expect(res.body.localityAttributes).toEqual({
        transportation: '지하철 SRT 동탄역 도보 10분',
        commercialArea: '정보 없음',
        schoolDistrict: '정보 없음',
        gangnamAccessibility: '정보 없음',
        entertainmentAndParks: '유흥주점 없음 (700m 이내)',
        developmentProspects: '정보 없음',
        nearbyJobs: '정보 없음',
      });
    });

    it('평택 매물 조회 시 fixture에 문자열로 저장된 "정보 없음" 값이 transportation에 그대로 반영된다', async () => {
      const res = await request(app).get(`/api/listings/${pyeongtaekListingId}/locality`);

      expect(res.status).toBe(200);
      expect(res.body.complexId).toBe(pyeongtaekId);
      expect(res.body.localityAttributes.transportation).toBe('정보 없음');
    });

    it('존재하지 않는 id 조회 시 404와 { message }를 응답한다', async () => {
      const res = await request(app).get('/api/listings/999999/locality');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: expect.any(String) });
    });
  });

  describe('GET /api/listings/:id/price-history', () => {
    const DATA_SOURCE = '국토교통부 아파트 실거래가 공개시스템(오픈API)';

    // 위례신도시 롯데캐슬은 fixture상 매물이 0건이므로 "실거래 이력 없음"(0건) 분기는
    // 이 통합 테스트로는 재현할 수 없다(매물이 없으면 listingId 자체가 없어 조회 불가).
    // 해당 분기는 price-history.service.test.js 유닛 테스트에서 rows=[] 케이스로 검증한다.

    it('동탄 매물(준공 1998, age>=20) 조회 시 200과 "최근 20년" 분기로 fixture 4건이 전부 반환된다', async () => {
      const listRes = await request(app).get('/api/listings');
      const dongtanListing = listRes.body.find((item) => item.complex.id === dongtanId);

      const res = await request(app).get(`/api/listings/${dongtanListing.id}/price-history`);

      expect(res.status).toBe(200);
      expect(res.body.listingId).toBe(dongtanListing.id);
      expect(res.body.complexId).toBe(dongtanId);
      expect(res.body.lookupPeriodType).toBe('최근 20년');
      expect(res.body.firstTransactionMonth).toBeNull();
      expect(res.body.entries).toHaveLength(4);
      expect(res.body.entries).toEqual([
        { transactionDate: '2007-01-01', transactionPrice: 45000, dataSource: DATA_SOURCE },
        { transactionDate: '2012-03-15', transactionPrice: 68000, dataSource: DATA_SOURCE },
        { transactionDate: '2018-07-01', transactionPrice: 90000, dataSource: DATA_SOURCE },
        { transactionDate: '2024-11-02', transactionPrice: 95000, dataSource: DATA_SOURCE },
      ]);
      res.body.entries.forEach((entry) => {
        expect(entry.dataSource).toBe(DATA_SOURCE);
      });
    });

    it('평택 매물(준공 2021, age<20) 조회 시 200과 "최초거래 이후" 분기로 fixture 3건이 전부 반환되고 firstTransactionMonth는 2021-06이다', async () => {
      const res = await request(app).get(`/api/listings/${pyeongtaekListingId}/price-history`);

      expect(res.status).toBe(200);
      expect(res.body.listingId).toBe(pyeongtaekListingId);
      expect(res.body.complexId).toBe(pyeongtaekId);
      expect(res.body.lookupPeriodType).toBe('최초거래 이후');
      expect(res.body.firstTransactionMonth).toBe('2021-06');
      expect(res.body.entries).toHaveLength(3);
      expect(res.body.entries).toEqual([
        { transactionDate: '2021-06-01', transactionPrice: 78000, dataSource: DATA_SOURCE },
        { transactionDate: '2023-02-14', transactionPrice: 92000, dataSource: DATA_SOURCE },
        { transactionDate: '2025-01-20', transactionPrice: 105000, dataSource: DATA_SOURCE },
      ]);
    });

    it('동일 단지(동탄, 매물 3건) 소속의 서로 다른 두 매물은 listingId만 다르고 나머지 실거래 이력 데이터는 동일하다(단지 단위 집계 확인)', async () => {
      const listRes = await request(app).get('/api/listings');
      const dongtanListings = listRes.body.filter((item) => item.complex.id === dongtanId);
      expect(dongtanListings.length).toBeGreaterThanOrEqual(2);

      const [first, second] = dongtanListings;

      const [resFirst, resSecond] = await Promise.all([
        request(app).get(`/api/listings/${first.id}/price-history`),
        request(app).get(`/api/listings/${second.id}/price-history`),
      ]);

      expect(resFirst.status).toBe(200);
      expect(resSecond.status).toBe(200);
      expect(resFirst.body.listingId).toBe(first.id);
      expect(resSecond.body.listingId).toBe(second.id);
      expect(resFirst.body.listingId).not.toBe(resSecond.body.listingId);

      const { listingId: listingIdFirst, ...restFirst } = resFirst.body;
      const { listingId: listingIdSecond, ...restSecond } = resSecond.body;
      expect(restFirst).toEqual(restSecond);
    });

    it('존재하지 않는 id 조회 시 404와 { message }를 응답한다', async () => {
      const res = await request(app).get('/api/listings/999999/price-history');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: expect.any(String) });
    });
  });

  describe('GET /api/listings/:id/regulation', () => {
    const completeProfilePayload = {
      workplace: '화성',
      ownershipStructure: '단독',
      annualIncome: 7000,
      annualBonus: 1000,
      availableCapital: 20000,
      housingOwnershipTier: '1주택',
      isFirstTimeBuyer: false,
    };

    // user_profiles는 id=1 단일 row를 전체 테스트 스위트가 공유하므로,
    // 프로필에 의존하는 테스트는 실행 전 완전한 프로필로 세팅하고 종료 후 전부 null로 되돌린다.
    async function resetProfile() {
      await pool.query(
        `UPDATE user_profiles SET workplace=NULL, ownership_structure=NULL, annual_income=NULL,
          annual_bonus=NULL, available_capital=NULL, housing_ownership_tier=NULL, is_first_time_buyer=NULL
         WHERE id = 1`
      );
    }

    it('동탄 매물(규제지역, 토허구역 확정 true) + 프로필 완료 시 200과 regulationConfirmationNeeded false, isLandTransactionPermissionZone true, ltvPercent 40, maxLoanAmount는 60000 이하 양의 정수, regionalLoanCapAmount 60000을 반환한다', async () => {
      await request(app).put('/api/user-profile').send(completeProfilePayload);
      try {
        const listRes = await request(app).get('/api/listings');
        const dongtanListing = listRes.body.find((item) => item.complex.id === dongtanId);

        const res = await request(app).get(`/api/listings/${dongtanListing.id}/regulation`);

        expect(res.status).toBe(200);
        expect(res.body.listingId).toBe(dongtanListing.id);
        expect(res.body.complexId).toBe(dongtanId);
        expect(res.body.regulationConfirmationNeeded).toBe(false);
        expect(res.body.isLandTransactionPermissionZone).toBe(true);
        expect(res.body.ltvPercent).toBe(40);
        expect(Number.isInteger(res.body.maxLoanAmount)).toBe(true);
        expect(res.body.maxLoanAmount).toBeGreaterThan(0);
        expect(res.body.maxLoanAmount).toBeLessThanOrEqual(60000);
        expect(res.body.regionalLoanCapAmount).toBe(60000);
      } finally {
        await resetProfile();
      }
    });

    it('평택 매물(비규제지역, 토허구역 미확정 null) + 프로필 완료 시 200과 regulationConfirmationNeeded true, isLandTransactionPermissionZone "확인필요", regionalLoanCapAmount null, ltvPercent는 비규제 기준(70)으로 임시 적용된다', async () => {
      await request(app).put('/api/user-profile').send(completeProfilePayload);
      try {
        const res = await request(app).get(`/api/listings/${pyeongtaekListingId}/regulation`);

        expect(res.status).toBe(200);
        expect(res.body.listingId).toBe(pyeongtaekListingId);
        expect(res.body.complexId).toBe(pyeongtaekId);
        expect(res.body.regulationConfirmationNeeded).toBe(true);
        expect(res.body.isLandTransactionPermissionZone).toBe('확인필요');
        expect(res.body.regionalLoanCapAmount).toBeNull();
        expect(res.body.ltvPercent).toBe(70);
      } finally {
        await resetProfile();
      }
    });

    it('프로필이 입력되지 않은 상태(기본 null 시드)로 조회 시 ltvPercent/maxLoanAmount는 null, profileMessage 안내 문구가 반환되며, isRegulatedArea/isLandTransactionPermissionZone/regulationConfirmationNeeded/regionalLoanCapAmount는 정상적으로 채워진다', async () => {
      const listRes = await request(app).get('/api/listings');
      const dongtanListing = listRes.body.find((item) => item.complex.id === dongtanId);

      const res = await request(app).get(`/api/listings/${dongtanListing.id}/regulation`);

      expect(res.status).toBe(200);
      expect(res.body.ltvPercent).toBeNull();
      expect(res.body.maxLoanAmount).toBeNull();
      expect(res.body.profileMessage).toBe('내 정보 입력 필요');
      expect(res.body.isRegulatedArea).not.toBeNull();
      expect(res.body.isLandTransactionPermissionZone).not.toBeNull();
      expect(res.body.regulationConfirmationNeeded).not.toBeNull();
      expect(res.body.regionalLoanCapAmount).not.toBeNull();
    });

    it('존재하지 않는 id 조회 시 404와 { message }를 응답한다', async () => {
      const res = await request(app).get('/api/listings/999999/regulation');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: expect.any(String) });
    });
  });

  describe('GET /api/listings/:id/loan-simulation', () => {
    const POLICY_MORTGAGE_NOTICE =
      '디딤돌대출·보금자리론 등 정책모기지는 계산 범위에서 제외되며, 필요 시 한국주택금융공사·주택도시기금 채널에서 별도 확인이 필요합니다.';

    const completeProfilePayload = {
      workplace: '화성',
      ownershipStructure: '단독',
      annualIncome: 7000,
      annualBonus: 1000,
      availableCapital: 20000,
      housingOwnershipTier: '1주택',
      isFirstTimeBuyer: false,
    };

    async function resetProfile() {
      await pool.query(
        `UPDATE user_profiles SET workplace=NULL, ownership_structure=NULL, annual_income=NULL,
          annual_bonus=NULL, available_capital=NULL, housing_ownership_tier=NULL, is_first_time_buyer=NULL
         WHERE id = 1`
      );
    }

    it('프로필 완료 + 동탄 매물 조회 시 200과 profileIncomplete false, scenarios 2건(단독/부부합산 모두 포함), recommendedScenario는 단독/부부합산/null 중 하나, policyMortgageNotice 정확한 문구를 반환한다', async () => {
      await request(app).put('/api/user-profile').send(completeProfilePayload);
      try {
        const listRes = await request(app).get('/api/listings');
        const dongtanListing = listRes.body.find((item) => item.complex.id === dongtanId);

        const res = await request(app).get(`/api/listings/${dongtanListing.id}/loan-simulation`);

        expect(res.status).toBe(200);
        expect(res.body.listingId).toBe(dongtanListing.id);
        expect(res.body.profileIncomplete).toBe(false);
        expect(Array.isArray(res.body.scenarios)).toBe(true);
        expect(res.body.scenarios).toHaveLength(2);
        const structures = res.body.scenarios.map((s) => s.ownershipStructure);
        expect(structures).toEqual(expect.arrayContaining(['단독', '부부합산']));
        expect(['단독', '부부합산', null]).toContain(res.body.recommendedScenario);
        expect(res.body.policyMortgageNotice).toBe(POLICY_MORTGAGE_NOTICE);
        res.body.scenarios.forEach((scenario) => {
          expect(scenario.interestRatePercent).toBe(4.5);
          expect(typeof scenario.interestRateSource).toBe('string');
          ['graduatedRepayment10y', 'graduatedRepayment20y', 'graduatedRepayment30y'].forEach((key) => {
            expect(typeof scenario[key].initialMonthlyPayment).toBe('number');
            expect(typeof scenario[key].finalMonthlyPayment).toBe('number');
          });
        });
      } finally {
        await resetProfile();
      }
    });

    it('프로필 미입력(기본 null 시드) 상태로 조회 시 200과 profileIncomplete true, scenarios null, recommendedScenario null, policyMortgageNotice는 그대로 반환된다', async () => {
      const listRes = await request(app).get('/api/listings');
      const dongtanListing = listRes.body.find((item) => item.complex.id === dongtanId);

      const res = await request(app).get(`/api/listings/${dongtanListing.id}/loan-simulation`);

      expect(res.status).toBe(200);
      expect(res.body.profileIncomplete).toBe(true);
      expect(res.body.scenarios).toBeNull();
      expect(res.body.recommendedScenario).toBeNull();
      expect(res.body.policyMortgageNotice).toBe(POLICY_MORTGAGE_NOTICE);
    });

    it('존재하지 않는 id 조회 시 404와 { message }를 응답한다', async () => {
      const res = await request(app).get('/api/listings/999999/loan-simulation');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: expect.any(String) });
    });
  });
});
