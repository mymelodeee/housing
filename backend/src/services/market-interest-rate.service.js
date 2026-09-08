const marketInterestRateRepository = require('../repositories/market-interest-rate.repository');
const { STALE_AFTER_DAYS } = require('../config/market-interest-rate');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// pg는 DATE 컬럼을 로컬 자정 기준 Date 객체로 파싱하므로, JSON 직렬화 시 UTC ISO 문자열로
// 변환되어 UTC+9 환경에서 날짜가 하루 밀려 보인다. 로컬 getter 기준 YYYY-MM-DD 문자열로 변환한다.
function formatLocalDate(value) {
  if (value === null || value === undefined) return null;
  if (!(value instanceof Date)) return value;
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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

function buildSourceLabel({ sourceName, referencePeriod, checkedAt, isStale }) {
  const staleNotice = isStale ? ' 30일 이상 재확인되지 않아 최신 발표와 다를 수 있음 — 확인 필요.' : '';
  return `${sourceName}(${referencePeriod} 기준, ${checkedAt} 확인).${staleNotice}`;
}

async function getCurrentRate({ today = new Date(), staleAfterDays = STALE_AFTER_DAYS } = {}) {
  const row = await marketInterestRateRepository.findCurrent();
  if (!row) return null;

  const checkedAt = formatLocalDate(row.checked_at);
  const daysSinceChecked = daysSince(row.checked_at, today);
  const isStale = daysSinceChecked === null ? false : daysSinceChecked >= staleAfterDays;

  return {
    ratePercent: Number(row.rate_percent),
    referencePeriod: row.reference_period,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    checkedAt,
    daysSinceChecked,
    isStale,
    sourceLabel: buildSourceLabel({ sourceName: row.source_name, referencePeriod: row.reference_period, checkedAt, isStale })
  };
}

async function refreshCurrentRate({ ratePercent, referencePeriod, sourceName, sourceUrl, checkedAt }) {
  return marketInterestRateRepository.updateCurrent({ ratePercent, referencePeriod, sourceName, sourceUrl, checkedAt });
}

module.exports = { getCurrentRate, refreshCurrentRate, STALE_AFTER_DAYS };
