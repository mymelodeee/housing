const { VALUE_STATUS_PRIORITY, RELIABILITY_PRIORITY } = require('../config/remodeling');

const ACTIONS = {
  INSERT: 'insert',
  TOUCH: 'touch',
  SUPERSEDE: 'supersede',
  CONFLICT: 'conflict',
  IGNORE: 'ignore'
};

function statusPriority(status) {
  return VALUE_STATUS_PRIORITY[status] ?? 0;
}

function reliabilityPriority(reliability) {
  return RELIABILITY_PRIORITY[reliability] ?? 0;
}

// value_numeric이 양쪽 다 있으면 숫자로, 아니면 문자열 trim으로 비교한다.
// ('1,234세대' 같은 표기 차이 때문에 문자열만 비교하면 불필요한 supersede가 발생한다)
function isSameValue(existingFact, incomingFact) {
  const existingNumeric = existingFact.value_numeric;
  const incomingNumeric = incomingFact.value_numeric;

  if (existingNumeric !== null && existingNumeric !== undefined &&
      incomingNumeric !== null && incomingNumeric !== undefined) {
    return Number(existingNumeric) === Number(incomingNumeric);
  }

  return String(existingFact.value ?? '').trim() === String(incomingFact.value ?? '').trim();
}

/**
 * 재조사 결과를 기존 값에 어떻게 반영할지 판정하는 순수 함수.
 * action: 'insert' | 'touch' | 'supersede' | 'conflict' | 'ignore'
 */
function resolveFactUpdate(existingFact, incomingFact) {
  if (!existingFact) {
    return { action: ACTIONS.INSERT, reason: '기존 값 없음 — 신규 등록' };
  }

  if (isSameValue(existingFact, incomingFact)) {
    return { action: ACTIONS.TOUCH, reason: '값 동일 — 마지막 검증일만 갱신' };
  }

  const existingStatus = statusPriority(existingFact.value_status);
  const incomingStatus = statusPriority(incomingFact.value_status);

  if (existingStatus > incomingStatus) {
    return {
      action: ACTIONS.IGNORE,
      reason: `기존 값(${existingFact.value_status})을 더 낮은 상태(${incomingFact.value_status})의 값으로 덮어쓰지 않음`
    };
  }

  if (incomingStatus > existingStatus) {
    return {
      action: ACTIONS.SUPERSEDE,
      reason: `값 상태 상향(${existingFact.value_status} → ${incomingFact.value_status})`
    };
  }

  const existingReliability = reliabilityPriority(existingFact.reliability);
  const incomingReliability = reliabilityPriority(incomingFact.reliability);

  if (incomingReliability > existingReliability) {
    return {
      action: ACTIONS.SUPERSEDE,
      reason: `동일 상태이나 더 신뢰도 높은 출처(${existingFact.reliability} → ${incomingFact.reliability})`
    };
  }

  return {
    action: ACTIONS.CONFLICT,
    reason: '동급 출처 간 값 충돌 — 기존 값 유지'
  };
}

function changelogEntry({ projectName, incomingFact, existingFact, action, reason }) {
  return {
    projectName,
    fieldName: incomingFact.field_name,
    fieldKey: incomingFact.field_key ?? null,
    action,
    before: existingFact ? existingFact.value : null,
    after: incomingFact.value,
    reason,
    sourceName: incomingFact.source_name ?? null
  };
}

function findExistingFact(currentFacts, incomingFact) {
  return (
    currentFacts.find(
      (row) =>
        row.field_name === incomingFact.field_name &&
        (row.field_key ?? null) === (incomingFact.field_key ?? null)
    ) || null
  );
}

async function applyFactUpdate({ repository, projectId, projectName, existingFact, incomingFact, action, reason, changelog }) {
  if (action === ACTIONS.INSERT) {
    await repository.insertFact({ projectId, ...incomingFact.insertPayload });
  } else if (action === ACTIONS.TOUCH) {
    // 변경 없는 항목은 checked_at UPDATE 1건만 실행해 DB write를 최소화한다.
    await repository.touchFactCheckedAt(existingFact.id, incomingFact.checked_at);
  } else if (action === ACTIONS.SUPERSEDE) {
    await repository.supersedeFact(existingFact.id);
    await repository.insertFact({ projectId, ...incomingFact.insertPayload });
  } else {
    // conflict / ignore: 값과 출처를 그대로 유지하고 충돌 표시만 남긴다.
    await repository.markFactConflicted(existingFact.id);
  }

  changelog.push(changelogEntry({ projectName, incomingFact, existingFact, action, reason }));
}

function normalizeIncomingFact(rawFact, sourceIdByKey, sourceMetaByKey) {
  const sourceId = rawFact.sourceKey ? sourceIdByKey.get(rawFact.sourceKey) ?? null : null;
  const sourceMeta = rawFact.sourceKey ? sourceMetaByKey.get(rawFact.sourceKey) || {} : {};

  return {
    field_name: rawFact.fieldName,
    field_key: rawFact.fieldKey ?? null,
    value: rawFact.value,
    value_numeric: rawFact.valueNumeric ?? null,
    value_status: rawFact.valueStatus,
    checked_at: rawFact.checkedAt,
    reliability: sourceMeta.reliability ?? null,
    source_name: sourceMeta.sourceName ?? null,
    insertPayload: {
      fieldName: rawFact.fieldName,
      fieldKey: rawFact.fieldKey ?? null,
      value: rawFact.value,
      valueNumeric: rawFact.valueNumeric ?? null,
      unit: rawFact.unit ?? null,
      valueStatus: rawFact.valueStatus,
      effectiveDate: rawFact.effectiveDate ?? null,
      checkedAt: rawFact.checkedAt,
      sourceId,
      confidence: rawFact.confidence ?? null
    }
  };
}

async function upsertProjectSources({ repository, projectId, rawSources, today }) {
  const sourceIdByKey = new Map();
  const sourceMetaByKey = new Map();

  for (const rawSource of rawSources) {
    const checkedAt = rawSource.checkedAt || today;
    const saved = await repository.upsertSource({
      projectId,
      sourceUrl: rawSource.sourceUrl ?? null,
      sourceName: rawSource.sourceName ?? null,
      sourceTitle: rawSource.sourceTitle ?? null,
      sourceType: rawSource.sourceType,
      sourceDate: rawSource.sourceDate ?? null,
      checkedAt,
      reliability: rawSource.reliability,
      isAccessible: rawSource.isAccessible ?? null
    });

    // 출처가 삭제/접근불가여도 행을 지우지 않고 표시만 남긴다.
    if (rawSource.isAccessible === false) {
      await repository.markSourceInaccessible(saved.id, checkedAt);
    }

    if (rawSource.key) {
      sourceIdByKey.set(rawSource.key, saved.id);
      sourceMetaByKey.set(rawSource.key, {
        reliability: rawSource.reliability,
        sourceName: rawSource.sourceName ?? null
      });
    }
  }

  return { sourceIdByKey, sourceMetaByKey };
}

/**
 * 조사 결과 payload를 resolveFactUpdate 규칙대로 DB에 반영하고 changelog를 반환한다.
 * repository를 주입받아 단위테스트에서 가짜 객체로 대체할 수 있게 한다.
 */
async function applyUpdates({ repository, payload, today }) {
  const changelog = [];
  const projects = (payload && payload.projects) || [];

  for (const rawProject of projects) {
    const lastCheckedAt = rawProject.lastCheckedAt || today;
    const project = await repository.upsertProject({
      complexId: rawProject.complexId ?? null,
      lawdCd: rawProject.lawdCd,
      complexName: rawProject.complexName,
      regionName: rawProject.regionName ?? null,
      projectName: rawProject.projectName ?? null,
      isActive: rawProject.isActive ?? null,
      lastCheckedAt,
      note: rawProject.note ?? null
    });

    const { sourceIdByKey, sourceMetaByKey } = await upsertProjectSources({
      repository,
      projectId: project.id,
      rawSources: rawProject.sources || [],
      today
    });

    const currentFacts = await repository.findCurrentFacts(project.id);

    for (const rawFact of rawProject.facts || []) {
      const incomingFact = normalizeIncomingFact(rawFact, sourceIdByKey, sourceMetaByKey);
      const existingFact = findExistingFact(currentFacts, incomingFact);
      const { action, reason } = resolveFactUpdate(existingFact, incomingFact);

      await applyFactUpdate({
        repository,
        projectId: project.id,
        projectName: rawProject.projectName || rawProject.complexName,
        existingFact,
        incomingFact,
        action,
        reason,
        changelog
      });
    }

    for (const rawStage of rawProject.stageHistory || []) {
      await repository.upsertStageHistory({
        projectId: project.id,
        stage: rawStage.stage,
        effectiveDate: rawStage.effectiveDate ?? null,
        status: rawStage.status,
        sourceId: rawStage.sourceKey ? sourceIdByKey.get(rawStage.sourceKey) ?? null : null,
        checkedAt: rawStage.checkedAt || today,
        note: rawStage.note ?? null
      });
    }
  }

  return changelog;
}

module.exports = { ACTIONS, isSameValue, resolveFactUpdate, applyUpdates };
