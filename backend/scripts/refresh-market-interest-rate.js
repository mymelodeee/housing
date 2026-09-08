/**
 * 대출 시뮬레이션 기준금리(한국은행 금융기관 가중평균금리, 예금은행 신규취급액 기준
 * 주택담보대출) 재조사 보조 스크립트.
 *
 * 한국은행이 매월 발표하지만 안정적인 공개 API가 없어(ECOS API 키 미보유) 사람이
 * 매월 발표 자료(bok.or.kr)를 직접 확인해 반영한다. 30일 이상 확인하지 않으면
 * isStale=true로 표시되어 재조사 대상임이 API 응답에 드러난다(GET /api/admin/market-interest-rate).
 *
 *   node scripts/refresh-market-interest-rate.js --check
 *   node scripts/refresh-market-interest-rate.js --apply --rate 4.48 --period 2026-07 \
 *       --source-name "한국은행 금융기관 가중평균금리(예금은행 신규취급액 기준 주택담보대출)" \
 *       --source-url https://www.bok.or.kr/portal/main/main.do --checked-at 2026-09-08
 */
require('dotenv').config();

const marketInterestRateService = require('../src/services/market-interest-rate.service');
const pool = require('../src/db/pool');

function parseArgs(argv) {
  const args = argv.slice(2);
  const mode = args.includes('--apply') ? 'apply' : args.includes('--check') ? 'check' : null;

  const getValue = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : null;
  };

  return {
    mode,
    ratePercent: getValue('--rate') !== null ? Number(getValue('--rate')) : null,
    referencePeriod: getValue('--period'),
    sourceName: getValue('--source-name'),
    sourceUrl: getValue('--source-url'),
    checkedAt: getValue('--checked-at')
  };
}

function todayLocalDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function runCheck() {
  const current = await marketInterestRateService.getCurrentRate();
  if (!current) {
    console.log('등록된 기준금리 정보가 없습니다.');
    return;
  }
  console.log(JSON.stringify(current, null, 2));
  if (current.isStale) {
    console.log(`\n[재조사 필요] 마지막 확인 후 ${current.daysSinceChecked}일 경과(기준 ${marketInterestRateService.STALE_AFTER_DAYS}일). bok.or.kr에서 최신 발표를 확인해 --apply로 갱신하세요.`);
  }
}

async function runApply({ ratePercent, referencePeriod, sourceName, sourceUrl, checkedAt }) {
  if (!Number.isFinite(ratePercent)) throw new Error('--rate 값은 숫자여야 합니다');
  if (!referencePeriod) throw new Error('--period 값이 필요합니다(예: 2026-07)');
  if (!sourceName) throw new Error('--source-name 값이 필요합니다');

  const updated = await marketInterestRateService.refreshCurrentRate({
    ratePercent,
    referencePeriod,
    sourceName,
    sourceUrl,
    checkedAt: checkedAt || todayLocalDate()
  });

  console.log('갱신 완료:', JSON.stringify(updated, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.mode === 'check') {
    await runCheck();
    return;
  }
  if (args.mode === 'apply') {
    await runApply(args);
    return;
  }

  throw new Error('사용법: node scripts/refresh-market-interest-rate.js --check | --apply --rate <숫자> --period <YYYY-MM> --source-name <문자열> [--source-url <URL>] [--checked-at <YYYY-MM-DD>]');
}

main()
  .catch((err) => {
    console.error('[ERROR] 기준금리 처리 실패:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
