jest.mock('../../src/repositories/remodeling.repository');

const remodelingRepository = require('../../src/repositories/remodeling.repository');
const {
  formatLocalDate,
  daysSince,
  mapFact,
  buildHouseholds,
  buildContributions,
  buildStageHistory,
  buildPriceLink,
  buildRemodelingResponse,
  buildNoProjectResponse,
  getStaleReport,
  getProjectView,
} = require('../../src/services/remodeling.service');

const TODAY = new Date(2026, 8, 7); // 2026-09-07 로컬
const OPTIONS = { today: TODAY, staleAfterDays: 30 };

function factRow(overrides = {}) {
  return {
    id: 1,
    project_id: 100,
    field_name: 'current_stage',
    field_key: null,
    value: '사업계획승인',
    value_numeric: null,
    unit: null,
    value_status: 'confirmed',
    effective_date: new Date(2025, 10, 18), // 2025-11-18
    checked_at: new Date(2026, 8, 7),
    source_id: 7,
    source_name: '용인시 고시',
    source_url: 'https://example.test/notice',
    source_date: new Date(2025, 10, 18),
    reliability: 'high',
    is_conflicted: false,
    ...overrides,
  };
}

describe('services/remodeling.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('formatLocalDate', () => {
    it('pg가 로컬 자정 Date로 파싱한 DATE를 하루 밀림 없이 YYYY-MM-DD로 변환한다', () => {
      expect(formatLocalDate(new Date(2025, 10, 18))).toBe('2025-11-18');
      expect(formatLocalDate(new Date(2026, 0, 1))).toBe('2026-01-01');
    });

    it('null/undefined는 null, 이미 문자열이면 그대로 반환한다', () => {
      expect(formatLocalDate(null)).toBeNull();
      expect(formatLocalDate(undefined)).toBeNull();
      expect(formatLocalDate('2026-09-07')).toBe('2026-09-07');
    });
  });

  describe('daysSince', () => {
    it('같은 날이면 0, 30일 전이면 30을 반환한다', () => {
      expect(daysSince(new Date(2026, 8, 7), TODAY)).toBe(0);
      expect(daysSince(new Date(2026, 7, 8), TODAY)).toBe(30);
    });

    it('파싱 불가능한 값이면 null을 반환한다', () => {
      expect(daysSince('안녕', TODAY)).toBeNull();
    });
  });

  describe('mapFact', () => {
    it('값·상태·기준일·검증일·출처를 계약 필드명으로 조립한다', () => {
      expect(mapFact(factRow(), OPTIONS)).toEqual({
        value: '사업계획승인',
        status: 'confirmed',
        effectiveDate: '2025-11-18',
        checkedAt: '2026-09-07',
        daysSinceChecked: 0,
        isStale: false,
        isConflicted: false,
        source: {
          name: '용인시 고시',
          url: 'https://example.test/notice',
          sourceDate: '2025-11-18',
          reliability: 'high',
        },
      });
    });

    it('daysSinceChecked가 staleAfterDays와 정확히 같으면 isStale은 true다(경계값)', () => {
      const result = mapFact(factRow({ checked_at: new Date(2026, 7, 8) }), OPTIONS);

      expect(result.daysSinceChecked).toBe(30);
      expect(result.isStale).toBe(true);
    });

    it('staleAfterDays보다 1일 적으면 isStale은 false다(경계값)', () => {
      const result = mapFact(factRow({ checked_at: new Date(2026, 7, 9) }), OPTIONS);

      expect(result.daysSinceChecked).toBe(29);
      expect(result.isStale).toBe(false);
    });

    it('source_id가 없으면 source는 null이다', () => {
      expect(mapFact(factRow({ source_id: null }), OPTIONS).source).toBeNull();
    });

    it('fact 자체가 없으면 null을 반환한다', () => {
      expect(mapFact(null, OPTIONS)).toBeNull();
    });
  });

  describe('buildHouseholds', () => {
    const before = factRow({ id: 2, field_name: 'household_count_before', value: '1234', value_numeric: '1234', unit: '세대' });
    const after = factRow({ id: 3, field_name: 'household_count_after', value: '1418', value_numeric: '1418', unit: '세대' });

    it('증가분은 저장값이 아니라 after - before로 계산된다', () => {
      const result = buildHouseholds([before, after], OPTIONS);

      expect(result.before).toBe(1234);
      expect(result.after).toBe(1418);
      expect(result.increase).toBe(184);
    });

    it('before만 있으면 increase는 null이고 before 기준 메타가 사용된다', () => {
      const result = buildHouseholds([before], OPTIONS);

      expect(result).toMatchObject({ before: 1234, after: null, increase: null, checkedAt: '2026-09-07' });
    });

    it('after만 있으면 increase는 null이다', () => {
      expect(buildHouseholds([after], OPTIONS).increase).toBeNull();
    });

    it('세대수 fact가 하나도 없으면 null을 반환한다', () => {
      expect(buildHouseholds([factRow()], OPTIONS)).toBeNull();
    });
  });

  describe('buildContributions', () => {
    it('평형별 분담금을 field_key 오름차순 배열로 반환한다', () => {
      const rows = [
        factRow({ id: 5, field_name: 'contribution_amount', field_key: '99B', value: '31000', value_numeric: '31000', unit: '만원', value_status: 'estimated' }),
        factRow({ id: 4, field_name: 'contribution_amount', field_key: '84A', value: '25000', value_numeric: '25000', unit: '만원', value_status: 'estimated' }),
      ];

      const result = buildContributions(rows, OPTIONS);

      expect(result.map((item) => item.unitType)).toEqual(['84A', '99B']);
      expect(result[0]).toEqual({
        unitType: '84A',
        amount: 25000,
        unit: '만원',
        status: 'estimated',
        effectiveDate: '2025-11-18',
        checkedAt: '2026-09-07',
        daysSinceChecked: 0,
        isStale: false,
        isConflicted: false,
        source: expect.objectContaining({ name: '용인시 고시' }),
      });
    });

    it('분담금 fact가 없으면 빈 배열이다', () => {
      expect(buildContributions([factRow()], OPTIONS)).toEqual([]);
    });
  });

  describe('buildStageHistory', () => {
    it('STAGE_ORDER 순서로 정렬해 반환한다', () => {
      const rows = [
        { stage: '사업계획승인', effective_date: new Date(2025, 10, 18), status: 'confirmed', checked_at: new Date(2026, 8, 7), source_id: null },
        { stage: '조합설립인가', effective_date: new Date(2021, 5, 30), status: 'confirmed', checked_at: new Date(2026, 8, 7), source_id: null },
      ];

      const result = buildStageHistory(rows, OPTIONS);

      expect(result.map((item) => item.stage)).toEqual(['조합설립인가', '사업계획승인']);
      expect(result[0]).toEqual({
        stage: '조합설립인가',
        effectiveDate: '2021-06-30',
        status: 'confirmed',
        checkedAt: '2026-09-07',
        source: null,
      });
    });
  });

  describe('buildPriceLink', () => {
    const entries = [
      { transactionDate: '2026-01-10', transactionPrice: 110000 },
      { transactionDate: '2026-08-20', transactionPrice: 118000 },
    ];

    it('가장 마지막(최신) 실거래 항목을 사용하고 대표 분담금을 더해 총비용을 계산한다', () => {
      const result = buildPriceLink({ entries, contributions: [{ amount: 25000 }, { amount: 31000 }] });

      expect(result).toEqual({
        recentTransactionPrice: 118000,
        recentTransactionDate: '2026-08-20',
        estimatedTotalCost: 143000,
        note: '실거래가는 매매가 변동 이력 탭 기준',
      });
    });

    it('분담금이 없으면 estimatedTotalCost는 null이다', () => {
      expect(buildPriceLink({ entries, contributions: [] }).estimatedTotalCost).toBeNull();
    });

    it('실거래 entries가 비었거나 배열이 아니면 null을 반환한다', () => {
      expect(buildPriceLink({ entries: [], contributions: [] })).toBeNull();
      expect(buildPriceLink({ entries: null, contributions: [] })).toBeNull();
    });

    it('최신 항목에 가격이 없으면 null을 반환한다', () => {
      expect(buildPriceLink({ entries: [{ transactionDate: '2026-08-20', transactionPrice: null }], contributions: [] })).toBeNull();
    });
  });

  describe('buildNoProjectResponse', () => {
    it('추진 정보가 없으면 hasProject false와 안내 문구를 반환한다', () => {
      expect(buildNoProjectResponse({ listingId: 12, complexId: 5 })).toEqual({
        listingId: 12,
        complexId: 5,
        hasProject: false,
        message: '리모델링 추진 정보 없음',
      });
    });
  });

  describe('buildRemodelingResponse', () => {
    it('계약된 필드명 전체를 조립하고, 값이 없는 항목은 null / 배열은 빈 배열로 채운다', () => {
      const result = buildRemodelingResponse({
        listingId: 12,
        complexId: 5,
        project: { id: 100, project_name: '샘플 리모델링주택조합', complex_name: '샘플단지A' },
        factRows: [factRow()],
        stageRows: [],
        priceEntries: [],
        today: TODAY,
        staleAfterDays: 30,
      });

      expect(result).toEqual({
        listingId: 12,
        complexId: 5,
        hasProject: true,
        projectName: '샘플 리모델링주택조합',
        complexName: '샘플단지A',
        currentStage: expect.objectContaining({ value: '사업계획승인', effectiveDate: '2025-11-18' }),
        households: null,
        contributions: [],
        loanStatus: null,
        stageHistory: [],
        priceLink: null,
        staleAfterDays: 30,
      });
    });

    it('loan_status fact가 있으면 loanStatus로 매핑된다', () => {
      const result = buildRemodelingResponse({
        listingId: 12,
        complexId: 5,
        project: { id: 100, project_name: null, complex_name: '샘플단지A' },
        factRows: [factRow({ field_name: 'loan_status', value: '이주비 대출 미확정', value_status: 'unknown', effective_date: null, source_id: null })],
        stageRows: [],
        today: TODAY,
        staleAfterDays: 30,
      });

      expect(result.loanStatus).toEqual({
        value: '이주비 대출 미확정',
        status: 'unknown',
        effectiveDate: null,
        checkedAt: '2026-09-07',
        daysSinceChecked: 0,
        isStale: false,
        isConflicted: false,
        source: null,
      });
      expect(result.projectName).toBeNull();
    });

    it('move_out_schedule fact는 저장되어 있어도 응답 계약에 없으므로 노출하지 않는다', () => {
      const result = buildRemodelingResponse({
        listingId: 12,
        complexId: 5,
        project: { id: 100, project_name: null, complex_name: '샘플단지A' },
        factRows: [factRow({ field_name: 'move_out_schedule', value: '2027년 상반기' })],
        stageRows: [],
        today: TODAY,
      });

      expect(Object.keys(result)).not.toContain('moveOutSchedule');
      expect(result.currentStage).toBeNull();
    });
  });

  describe('getProjectView', () => {
    it('현재값과 단계 이력을 조회해 응답을 조립한다', async () => {
      remodelingRepository.findCurrentFacts.mockResolvedValue([factRow()]);
      remodelingRepository.findStageHistory.mockResolvedValue([]);

      const result = await getProjectView({
        listingId: 12,
        complexId: 5,
        project: { id: 100, project_name: '샘플조합', complex_name: '샘플단지A' },
        priceEntries: [{ transactionDate: '2026-08-20', transactionPrice: 118000 }],
        today: TODAY,
        staleAfterDays: 30,
      });

      expect(remodelingRepository.findCurrentFacts).toHaveBeenCalledWith(100);
      expect(remodelingRepository.findStageHistory).toHaveBeenCalledWith(100);
      expect(result.hasProject).toBe(true);
      expect(result.priceLink).toMatchObject({ recentTransactionPrice: 118000, estimatedTotalCost: null });
    });
  });

  describe('getStaleReport', () => {
    it('fact/단계이력/출처를 각각 카멜케이스로 매핑하고 totalCount를 합산한다', async () => {
      remodelingRepository.findStaleFacts.mockResolvedValue([
        {
          id: 1,
          project_id: 100,
          project_name: '샘플조합',
          complex_name: '샘플단지A',
          lawd_cd: '41465',
          field_name: 'contribution_amount',
          field_key: '84A',
          value: '25000',
          value_status: 'estimated',
          effective_date: new Date(2026, 2, 1),
          checked_at: new Date(2026, 6, 1),
          days_since_checked: 68,
          source_name: '샘플 출처',
          source_url: null,
          reliability: 'low',
        },
      ]);
      remodelingRepository.findStaleStageHistory.mockResolvedValue([
        {
          id: 2,
          project_id: 100,
          project_name: '샘플조합',
          complex_name: '샘플단지A',
          lawd_cd: '41465',
          stage: '조합설립인가',
          status: 'confirmed',
          effective_date: new Date(2021, 5, 30),
          checked_at: new Date(2026, 6, 1),
          days_since_checked: 68,
          source_name: null,
          source_url: null,
          reliability: null,
        },
      ]);
      remodelingRepository.findStaleSources.mockResolvedValue([
        {
          id: 3,
          project_id: 100,
          project_name: '샘플조합',
          complex_name: '샘플단지A',
          lawd_cd: '41465',
          source_name: '샘플 출처',
          source_title: '샘플 공고문',
          source_url: null,
          source_type: '기타',
          source_date: null,
          checked_at: new Date(2026, 6, 1),
          days_since_checked: 68,
          reliability: 'low',
          is_accessible: false,
        },
      ]);

      const result = await getStaleReport({ staleAfterDays: 30, today: TODAY });

      expect(result.staleAfterDays).toBe(30);
      expect(result.checkedOn).toBe('2026-09-07');
      expect(result.totalCount).toBe(3);
      expect(result.facts[0]).toEqual({
        projectId: 100,
        projectName: '샘플조합',
        complexName: '샘플단지A',
        lawdCd: '41465',
        fieldName: 'contribution_amount',
        fieldKey: '84A',
        value: '25000',
        valueStatus: 'estimated',
        effectiveDate: '2026-03-01',
        checkedAt: '2026-07-01',
        daysSinceChecked: 68,
        isStale: true,
        sourceName: '샘플 출처',
        sourceUrl: null,
        reliability: 'low',
      });
      expect(result.stageHistory[0]).toMatchObject({ stage: '조합설립인가', valueStatus: 'confirmed', isStale: true });
      expect(result.sources[0]).toMatchObject({ value: '샘플 공고문', valueStatus: 'unknown', isStale: true });
    });

    it('인자 없이 호출하면 config 기본값(30)이 repository에 전달된다', async () => {
      remodelingRepository.findStaleFacts.mockResolvedValue([]);
      remodelingRepository.findStaleStageHistory.mockResolvedValue([]);
      remodelingRepository.findStaleSources.mockResolvedValue([]);

      const result = await getStaleReport();

      expect(remodelingRepository.findStaleFacts).toHaveBeenCalledWith({ staleAfterDays: 30 });
      expect(result.totalCount).toBe(0);
    });
  });
});
