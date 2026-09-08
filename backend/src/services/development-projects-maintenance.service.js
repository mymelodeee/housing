const developmentProjectsRepository = require('../repositories/development-projects.repository');

const DEFAULT_STALE_DAYS = 30;
const CONFIDENCE_VALUES = new Set(['high', 'medium', 'low']);

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function validateEntry(entry) {
  const required = ['lawdCd', 'projectName', 'category', 'status', 'checkedAt', 'confidence', 'sources'];
  for (const field of required) {
    if (entry[field] === undefined || entry[field] === null) throw new Error(`개발호재 필수 필드 누락: ${field}`);
  }
  if (!CONFIDENCE_VALUES.has(entry.confidence)) throw new Error(`개발호재 confidence 오류: ${entry.confidence}`);
  if (!Array.isArray(entry.sources) || entry.sources.length === 0) throw new Error('개발호재는 최소 1개의 검증 출처가 필요합니다.');
  for (const source of entry.sources) {
    for (const field of ['sourceUrl', 'sourceName', 'sourceDate', 'sourceType', 'reliability']) {
      if (!(field in source)) throw new Error(`개발호재 출처 필드 누락: ${field}`);
    }
    if (!source.sourceUrl || !source.sourceName) throw new Error('개발호재 출처 URL과 이름은 필수입니다.');
  }
}

function hasProjectChanged(existing, entry) {
  return existing.region_name !== (entry.regionName ?? null)
    || existing.category !== entry.category
    || existing.status !== entry.status
    || normalizeDate(existing.effective_date) !== normalizeDate(entry.effectiveDate)
    || existing.confidence !== entry.confidence
    || existing.note !== (entry.note ?? null);
}

async function syncSources(projectId, entry) {
  for (const source of entry.sources) {
    await developmentProjectsRepository.upsertSource({
      projectId,
      sourceUrl: source.sourceUrl,
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      sourceDate: source.sourceDate,
      checkedAt: source.checkedAt ?? entry.checkedAt,
      reliability: source.reliability,
      isAccessible: source.isAccessible,
    });
  }
}

async function refreshCuratedProject(entry) {
  validateEntry(entry);
  const existing = await developmentProjectsRepository.findProjectByLawdCdAndName(entry.lawdCd, entry.projectName);

  if (!existing) {
    const project = await developmentProjectsRepository.insertProject({
      lawdCd: entry.lawdCd,
      regionName: entry.regionName,
      projectName: entry.projectName,
      category: entry.category,
      status: entry.status,
      effectiveDate: entry.effectiveDate,
      checkedAt: entry.checkedAt,
      confidence: entry.confidence,
      note: entry.note,
    });
    await syncSources(project.id, entry);
    return { action: 'inserted', project };
  }

  if (entry.hasConflict === true) {
    const project = await developmentProjectsRepository.markProjectConflict({ projectId: existing.id, checkedAt: entry.checkedAt });
    await syncSources(existing.id, entry);
    return { action: 'conflicted', project };
  }

  if (!hasProjectChanged(existing, entry)) {
    const project = await developmentProjectsRepository.touchProjectVerification({
      projectId: existing.id,
      checkedAt: entry.checkedAt,
      confidence: entry.confidence,
    });
    await syncSources(existing.id, entry);
    return { action: 'verified', project };
  }

  const project = await developmentProjectsRepository.replaceProjectWithHistory({
    projectId: existing.id,
    regionName: entry.regionName,
    category: entry.category,
    status: entry.status,
    effectiveDate: entry.effectiveDate,
    checkedAt: entry.checkedAt,
    confidence: entry.confidence,
    note: entry.note,
  });
  await syncSources(existing.id, entry);
  return { action: 'updated', project };
}

async function listStaleProjects(staleDays = DEFAULT_STALE_DAYS) {
  return developmentProjectsRepository.findStaleProjects(staleDays);
}

module.exports = { DEFAULT_STALE_DAYS, validateEntry, hasProjectChanged, refreshCuratedProject, listStaleProjects };
