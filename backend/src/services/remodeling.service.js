const remodelingRepository = require('../repositories/remodeling.repository');
const { STALE_AFTER_DAYS, STAGE_ORDER, FIELD_NAMES } = require('../config/remodeling');

const PRICE_LINK_NOTE = '실거래가는 매매가 변동 이력 탭 기준';
const NO_PROJECT_MESSAGE = '리모델링 추진 정보 없음';

// pg는 DATE 컬럼을 로컬 자정 기준 Date 객체로 파싱하므로, JSON 직렬화 시 UTC ISO 문자열로
// 변환되어 UTC+9 환경에서 날짜가 하루 밀려 보인다(regional-transactions.service.js와 동일 이슈).
// 로컬 getter 기준 YYYY-MM-DD 문자열로 변환해 반환한다.
function formatLocalDate(value) {
  if (value === null || value === undefined) return null;
  if (!(value instanceof Date)) return value;
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 시분초/타임존 영향을 배제하기 위해 로컬 날짜만 떼어 UTC 자정으로 정규화한 뒤 뺀다.
function toLocalMidnightUtc(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysSince(checkedAt, today) {
  const from = toLocalMidnightUtc(checkedAt);
  const to = toLocalMidnightUtc(today);
  if (from === null || to === null) return null;
  return Math.round((to - from) / MS_PER_DAY);
}

function mapSource(row) {
  if (!row || !row.source_id) return null;
  return {
    name: row.source_name ?? null,
    url: row.source_url ?? null,
    sourceDate: formatLocalDate(row.source_date),
    reliability: row.reliability ?? null
  };
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function buildMeta(row, { today, staleAfterDays }) {
  const daysSinceChecked = daysSince(row.checked_at, today);
  return {
    checkedAt: formatLocalDate(row.checked_at),
    daysSinceChecked,
    isStale: daysSinceChecked === null ? false : daysSinceChecked >= staleAfterDays
  };
}

function mapFact(row, options) {
  if (!row) return null;
  const meta = buildMeta(row, options);
  return {
    value: row.value,
    status: row.value_status,
    effectiveDate: formatLocalDate(row.effective_date),
    checkedAt: meta.checkedAt,
    daysSinceChecked: meta.daysSinceChecked,
    isStale: meta.isStale,
    isConflicted: Boolean(row.is_conflicted),
    source: mapSource(row)
  };
}

function findFact(factRows, fieldName) {
  return factRows.find((row) => row.field_name === fieldName) || null;
}

function buildHouseholds(factRows, options) {
  const beforeRow = findFact(factRows, FIELD_NAMES.HOUSEHOLD_COUNT_BEFORE);
  const afterRow = findFact(factRows, FIELD_NAMES.HOUSEHOLD_COUNT_AFTER);
  if (!beforeRow && !afterRow) return null;

  const before = toNumberOrNull(beforeRow && beforeRow.value_numeric);
  const after = toNumberOrNull(afterRow && afterRow.value_numeric);
  // 증가분은 저장하지 않고 파생 계산한다. 둘 중 하나라도 없으면 null.
  const increase = before === null || after === null ? null : after - before;

  const representativeRow = afterRow || beforeRow;
  const meta = buildMeta(representativeRow, options);

  return {
    before,
    after,
    increase,
    status: representativeRow.value_status,
    effectiveDate: formatLocalDate(representativeRow.effective_date),
    checkedAt: meta.checkedAt,
    daysSinceChecked: meta.daysSinceChecked,
    isStale: meta.isStale,
    source: mapSource(representativeRow)
  };
}

function buildContributions(factRows, options) {
  return factRows
    .filter((row) => row.field_name === FIELD_NAMES.CONTRIBUTION_AMOUNT)
    .sort((a, b) => String(a.field_key || '').localeCompare(String(b.field_key || '')))
    .map((row) => {
      const meta = buildMeta(row, options);
      return {
        unitType: row.field_key ?? null,
        amount: toNumberOrNull(row.value_numeric),
        unit: row.unit ?? null,
        status: row.value_status,
        effectiveDate: formatLocalDate(row.effective_date),
        checkedAt: meta.checkedAt,
        daysSinceChecked: meta.daysSinceChecked,
        isStale: meta.isStale,
        isConflicted: Boolean(row.is_conflicted),
        source: mapSource(row)
      };
    });
}

function buildStageHistory(stageRows, options) {
  return [...stageRows]
    .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage))
    .map((row) => ({
      stage: row.stage,
      effectiveDate: formatLocalDate(row.effective_date),
      status: row.status,
      checkedAt: formatLocalDate(row.checked_at),
      source: mapSource(row)
    }));
}

// 실거래가는 새로 조회하지 않고, 이미 존재하는 매매가 변동 이력 결과의 최신 항목만 재사용한다.
function buildPriceLink({ entries, contributions }) {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const latest = entries[entries.length - 1];
  const recentTransactionPrice = toNumberOrNull(latest.transactionPrice);
  if (recentTransactionPrice === null) return null;

  const representativeAmount = contributions.length > 0 ? contributions[0].amount : null;

  return {
    recentTransactionPrice,
    recentTransactionDate: formatLocalDate(latest.transactionDate),
    estimatedTotalCost: representativeAmount === null ? null : recentTransactionPrice + representativeAmount,
    note: PRICE_LINK_NOTE
  };
}

function buildNoProjectResponse({ listingId, complexId }) {
  return { listingId, complexId, hasProject: false, message: NO_PROJECT_MESSAGE };
}

function buildRemodelingResponse({
  listingId,
  complexId,
  project,
  factRows = [],
  stageRows = [],
  priceEntries = [],
  today = new Date(),
  staleAfterDays = STALE_AFTER_DAYS
}) {
  const options = { today, staleAfterDays };
  const contributions = buildContributions(factRows, options);

  return {
    listingId,
    complexId,
    hasProject: true,
    projectName: project.project_name ?? null,
    complexName: project.complex_name ?? null,
    currentStage: mapFact(findFact(factRows, FIELD_NAMES.CURRENT_STAGE), options),
    households: buildHouseholds(factRows, options),
    contributions,
    loanStatus: mapFact(findFact(factRows, FIELD_NAMES.LOAN_STATUS), options),
    stageHistory: buildStageHistory(stageRows, options),
    priceLink: buildPriceLink({ entries: priceEntries, contributions }),
    staleAfterDays
  };
}

function mapStaleRow(row, extra) {
  return {
    projectId: row.project_id,
    projectName: row.project_name ?? null,
    complexName: row.complex_name ?? null,
    lawdCd: row.lawd_cd ?? null,
    ...extra,
    effectiveDate: formatLocalDate(row.effective_date),
    checkedAt: formatLocalDate(row.checked_at),
    daysSinceChecked: row.days_since_checked,
    isStale: true,
    sourceName: row.source_name ?? null,
    sourceUrl: row.source_url ?? null,
    reliability: row.reliability ?? null
  };
}

async function getStaleReport({ staleAfterDays = STALE_AFTER_DAYS, today = new Date() } = {}) {
  const [factRows, stageRows, sourceRows] = await Promise.all([
    remodelingRepository.findStaleFacts({ staleAfterDays }),
    remodelingRepository.findStaleStageHistory({ staleAfterDays }),
    remodelingRepository.findStaleSources({ staleAfterDays })
  ]);

  const facts = factRows.map((row) =>
    mapStaleRow(row, {
      fieldName: row.field_name,
      fieldKey: row.field_key ?? null,
      value: row.value,
      valueStatus: row.value_status
    })
  );
  const stageHistory = stageRows.map((row) =>
    mapStaleRow(row, {
      stage: row.stage,
      fieldName: 'stage',
      fieldKey: null,
      value: row.stage,
      valueStatus: row.status
    })
  );
  const sources = sourceRows.map((row) =>
    mapStaleRow(row, {
      fieldName: 'source',
      fieldKey: null,
      value: row.source_title ?? row.source_name ?? row.source_url ?? null,
      valueStatus: row.is_accessible ? 'confirmed' : 'unknown'
    })
  );

  return {
    staleAfterDays,
    checkedOn: formatLocalDate(today),
    facts,
    stageHistory,
    sources,
    totalCount: facts.length + stageHistory.length + sources.length
  };
}

async function getProjectView({ listingId, complexId, project, priceEntries, today, staleAfterDays }) {
  const [factRows, stageRows] = await Promise.all([
    remodelingRepository.findCurrentFacts(project.id),
    remodelingRepository.findStageHistory(project.id)
  ]);

  return buildRemodelingResponse({
    listingId,
    complexId,
    project,
    factRows,
    stageRows,
    priceEntries,
    today,
    staleAfterDays
  });
}

module.exports = {
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
  getProjectView
};
