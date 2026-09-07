const {
  isSameValue,
  resolveFactUpdate,
  applyUpdates,
} = require('../../src/services/remodeling-maintenance.service');

function existing(overrides = {}) {
  return {
    id: 11,
    field_name: 'current_stage',
    field_key: null,
    value: '조합설립인가',
    value_numeric: null,
    value_status: 'confirmed',
    reliability: 'high',
    ...overrides,
  };
}

function incoming(overrides = {}) {
  return {
    field_name: 'current_stage',
    field_key: null,
    value: '안전진단',
    value_numeric: null,
    value_status: 'confirmed',
    checked_at: '2026-09-07',
    reliability: 'high',
    source_name: '용인시 고시',
    insertPayload: { fieldName: 'current_stage', fieldKey: null, value: '안전진단' },
    ...overrides,
  };
}

function createRepository() {
  return {
    upsertProject: jest.fn(async (input) => ({ id: 100, ...input })),
    upsertSource: jest.fn(async () => ({ id: 7 })),
    upsertStageHistory: jest.fn(async () => ({ id: 21 })),
    findCurrentFacts: jest.fn(async () => []),
    insertFact: jest.fn(async () => ({ id: 31 })),
    supersedeFact: jest.fn(async () => ({ id: 11 })),
    touchFactCheckedAt: jest.fn(async () => ({ id: 11 })),
    markFactConflicted: jest.fn(async () => ({ id: 11 })),
    markSourceInaccessible: jest.fn(async () => ({ id: 7 })),
  };
}

describe('services/remodeling-maintenance.service', () => {
  describe('isSameValue', () => {
    it('value_numeric이 양쪽 다 있으면 문자열 표기가 달라도 숫자로 비교한다', () => {
      expect(isSameValue(existing({ value: '1,234세대', value_numeric: '1234' }), incoming({ value: '1234', value_numeric: 1234 }))).toBe(true);
    });

    it('value_numeric이 없으면 trim한 문자열로 비교한다', () => {
      expect(isSameValue(existing({ value: ' 조합설립인가 ' }), incoming({ value: '조합설립인가' }))).toBe(true);
      expect(isSameValue(existing(), incoming())).toBe(false);
    });
  });

  describe('resolveFactUpdate', () => {
    it('규칙1: 기존 fact가 없으면 insert', () => {
      expect(resolveFactUpdate(null, incoming())).toEqual({ action: 'insert', reason: expect.any(String) });
    });

    it('규칙2: 값이 동일하면 touch (문자열)', () => {
      expect(resolveFactUpdate(existing(), incoming({ value: '조합설립인가' })).action).toBe('touch');
    });

    it('규칙2: 값이 동일하면 touch (숫자 비교)', () => {
      const result = resolveFactUpdate(
        existing({ field_name: 'household_count_before', value: '1,234', value_numeric: '1234' }),
        incoming({ field_name: 'household_count_before', value: '1234세대', value_numeric: 1234 })
      );

      expect(result.action).toBe('touch');
    });

    it('규칙3: 값이 변경되고 상태가 상향되면 supersede', () => {
      const result = resolveFactUpdate(
        existing({ value_status: 'estimated' }),
        incoming({ value_status: 'confirmed' })
      );

      expect(result.action).toBe('supersede');
    });

    it('규칙4: 기존이 confirmed인데 들어온 값이 estimated면 ignore (절대 덮어쓰지 않음)', () => {
      const result = resolveFactUpdate(
        existing({ value_status: 'confirmed' }),
        incoming({ value_status: 'estimated' })
      );

      expect(result.action).toBe('ignore');
      expect(result.reason).toContain('덮어쓰지 않음');
    });

    it('규칙4: confirmed -> proposal / unknown 도 동일하게 ignore', () => {
      expect(resolveFactUpdate(existing(), incoming({ value_status: 'proposal' })).action).toBe('ignore');
      expect(resolveFactUpdate(existing(), incoming({ value_status: 'unknown' })).action).toBe('ignore');
    });

    it('규칙5: 값이 다르고 상태 동급 + 출처 신뢰도 동급이면 conflict (값 유지)', () => {
      const result = resolveFactUpdate(
        existing({ value_status: 'estimated', reliability: 'medium' }),
        incoming({ value_status: 'estimated', reliability: 'medium' })
      );

      expect(result.action).toBe('conflict');
      expect(result.reason).toContain('기존 값 유지');
    });

    it('규칙5: 상태 동급인데 새 출처 신뢰도가 더 낮아도 기존 값을 유지하고 conflict', () => {
      const result = resolveFactUpdate(
        existing({ value_status: 'estimated', reliability: 'high' }),
        incoming({ value_status: 'estimated', reliability: 'low' })
      );

      expect(result.action).toBe('conflict');
    });

    it('규칙6: 값이 다르고 상태 동급이며 새 출처 신뢰도가 더 높으면 supersede', () => {
      const result = resolveFactUpdate(
        existing({ value_status: 'estimated', reliability: 'low' }),
        incoming({ value_status: 'estimated', reliability: 'high' })
      );

      expect(result.action).toBe('supersede');
    });

    it('알 수 없는 상태/신뢰도 문자열은 최하위로 취급한다', () => {
      const result = resolveFactUpdate(
        existing({ value_status: '알수없음', reliability: '알수없음' }),
        incoming({ value_status: 'confirmed' })
      );

      expect(result.action).toBe('supersede');
    });
  });

  describe('applyUpdates', () => {
    const payload = {
      projects: [
        {
          lawdCd: '41465',
          complexName: '샘플단지A',
          projectName: '샘플조합',
          lastCheckedAt: '2026-09-07',
          sources: [
            { key: 'a1', sourceName: '샘플 출처', sourceType: '기타', checkedAt: '2026-09-07', reliability: 'low' },
          ],
          facts: [
            {
              fieldName: 'current_stage',
              value: '안전진단',
              valueStatus: 'unknown',
              checkedAt: '2026-09-07',
              sourceKey: 'a1',
            },
          ],
          stageHistory: [
            { stage: '추진위원회', status: 'unknown', checkedAt: '2026-09-07', sourceKey: 'a1' },
          ],
        },
      ],
    };

    it('기존 값이 없으면 insertFact를 호출하고 changelog에 insert가 기록된다', async () => {
      const repository = createRepository();

      const changelog = await applyUpdates({ repository, payload, today: '2026-09-07' });

      expect(repository.upsertProject).toHaveBeenCalledWith(expect.objectContaining({ lawdCd: '41465', complexName: '샘플단지A' }));
      expect(repository.insertFact).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 100, fieldName: 'current_stage', value: '안전진단', sourceId: 7 })
      );
      expect(repository.upsertStageHistory).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 100, stage: '추진위원회', sourceId: 7 })
      );
      expect(changelog).toEqual([
        {
          projectName: '샘플조합',
          fieldName: 'current_stage',
          fieldKey: null,
          action: 'insert',
          before: null,
          after: '안전진단',
          reason: expect.any(String),
          sourceName: '샘플 출처',
        },
      ]);
    });

    it('규칙8: 값이 동일하면 checked_at UPDATE 1건만 실행하고 insert/supersede는 하지 않는다', async () => {
      const repository = createRepository();
      repository.findCurrentFacts.mockResolvedValue([
        { id: 11, field_name: 'current_stage', field_key: null, value: '안전진단', value_numeric: null, value_status: 'unknown', reliability: 'low' },
      ]);

      const changelog = await applyUpdates({ repository, payload, today: '2026-09-07' });

      expect(repository.touchFactCheckedAt).toHaveBeenCalledWith(11, '2026-09-07');
      expect(repository.insertFact).not.toHaveBeenCalled();
      expect(repository.supersedeFact).not.toHaveBeenCalled();
      expect(changelog[0]).toMatchObject({ action: 'touch', before: '안전진단', after: '안전진단' });
    });

    it('값이 변경되고 상태가 상향되면 기존 행을 supersede하고 새 행을 insert한다', async () => {
      const repository = createRepository();
      repository.findCurrentFacts.mockResolvedValue([
        { id: 11, field_name: 'current_stage', field_key: null, value: '조합설립인가', value_numeric: null, value_status: 'unknown', reliability: 'low' },
      ]);
      const confirmedPayload = JSON.parse(JSON.stringify(payload));
      confirmedPayload.projects[0].facts[0].valueStatus = 'confirmed';

      const changelog = await applyUpdates({ repository, payload: confirmedPayload, today: '2026-09-07' });

      expect(repository.supersedeFact).toHaveBeenCalledWith(11);
      expect(repository.insertFact).toHaveBeenCalledTimes(1);
      expect(changelog[0]).toMatchObject({ action: 'supersede', before: '조합설립인가', after: '안전진단' });
    });

    it('confirmed 값을 낮은 상태 값으로 덮어쓰려 하면 ignore 처리하고 기존 행에 충돌 표시만 남긴다', async () => {
      const repository = createRepository();
      repository.findCurrentFacts.mockResolvedValue([
        { id: 11, field_name: 'current_stage', field_key: null, value: '조합설립인가', value_numeric: null, value_status: 'confirmed', reliability: 'high' },
      ]);

      const changelog = await applyUpdates({ repository, payload, today: '2026-09-07' });

      expect(repository.markFactConflicted).toHaveBeenCalledWith(11);
      expect(repository.insertFact).not.toHaveBeenCalled();
      expect(repository.supersedeFact).not.toHaveBeenCalled();
      expect(changelog[0]).toMatchObject({ action: 'ignore' });
    });

    it('규칙7: 출처가 접근 불가면 행을 지우지 않고 is_accessible=false + checked_at만 갱신한다', async () => {
      const repository = createRepository();
      const inaccessiblePayload = JSON.parse(JSON.stringify(payload));
      inaccessiblePayload.projects[0].sources[0].isAccessible = false;

      await applyUpdates({ repository, payload: inaccessiblePayload, today: '2026-09-07' });

      expect(repository.upsertSource).toHaveBeenCalledWith(expect.objectContaining({ isAccessible: false }));
      expect(repository.markSourceInaccessible).toHaveBeenCalledWith(7, '2026-09-07');
    });

    it('sourceKey가 없는 fact는 sourceId null로 저장되고 changelog의 sourceName도 null이다', async () => {
      const repository = createRepository();
      const noSourcePayload = JSON.parse(JSON.stringify(payload));
      delete noSourcePayload.projects[0].facts[0].sourceKey;

      const changelog = await applyUpdates({ repository, payload: noSourcePayload, today: '2026-09-07' });

      expect(repository.insertFact).toHaveBeenCalledWith(expect.objectContaining({ sourceId: null }));
      expect(changelog[0].sourceName).toBeNull();
    });

    it('projects가 비어 있거나 payload가 비면 빈 changelog를 반환한다', async () => {
      const repository = createRepository();

      expect(await applyUpdates({ repository, payload: { projects: [] }, today: '2026-09-07' })).toEqual([]);
      expect(await applyUpdates({ repository, payload: null, today: '2026-09-07' })).toEqual([]);
    });

    it('lastCheckedAt/checkedAt이 없으면 today가 대신 사용된다', async () => {
      const repository = createRepository();
      const minimalPayload = {
        projects: [
          {
            lawdCd: '41117',
            complexName: '샘플단지B',
            sources: [{ key: 'b1', sourceType: '기타', reliability: 'low' }],
            facts: [],
            stageHistory: [{ stage: '추진위원회', status: 'unknown' }],
          },
        ],
      };

      await applyUpdates({ repository, payload: minimalPayload, today: '2026-09-07' });

      expect(repository.upsertProject).toHaveBeenCalledWith(expect.objectContaining({ lastCheckedAt: '2026-09-07' }));
      expect(repository.upsertSource).toHaveBeenCalledWith(expect.objectContaining({ checkedAt: '2026-09-07' }));
      expect(repository.upsertStageHistory).toHaveBeenCalledWith(expect.objectContaining({ checkedAt: '2026-09-07', sourceId: null }));
    });

    it('평형별 분담금은 field_key까지 일치하는 기존 값만 비교 대상으로 삼는다', async () => {
      const repository = createRepository();
      repository.findCurrentFacts.mockResolvedValue([
        { id: 41, field_name: 'contribution_amount', field_key: '84A', value: '25000', value_numeric: '25000', value_status: 'estimated', reliability: 'low' },
      ]);
      const contributionPayload = {
        projects: [
          {
            lawdCd: '41465',
            complexName: '샘플단지A',
            lastCheckedAt: '2026-09-07',
            sources: [],
            facts: [
              { fieldName: 'contribution_amount', fieldKey: '99B', value: '31000', valueNumeric: 31000, valueStatus: 'estimated', checkedAt: '2026-09-07' },
            ],
            stageHistory: [],
          },
        ],
      };

      const changelog = await applyUpdates({ repository, payload: contributionPayload, today: '2026-09-07' });

      expect(changelog[0]).toMatchObject({ action: 'insert', fieldKey: '99B', before: null });
      expect(repository.markFactConflicted).not.toHaveBeenCalled();
    });
  });
});
