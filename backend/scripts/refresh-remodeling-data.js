/**
 * 리모델링 추진 정보 재조사 보조 스크립트.
 *
 * 단일 공식 API가 없어 수동 리서치에 의존하므로, "무엇을 다시 조사해야 하는지"를
 * 뽑아내고(--list), 조사 결과를 규칙대로 반영하는(--apply) 두 경로만 제공한다.
 *
 *   node scripts/refresh-remodeling-data.js --list [--days 30]
 *   node scripts/refresh-remodeling-data.js --apply data/remodeling-seed.json
 *
 * 초기 시드도 --apply 경로로 처리한다(별도 시드 스크립트를 만들지 않는다).
 * 로직은 전부 service에 있고 이 파일은 인자 파싱과 출력만 담당한다.
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const remodelingService = require('../src/services/remodeling.service');
const remodelingMaintenanceService = require('../src/services/remodeling-maintenance.service');
const remodelingRepository = require('../src/repositories/remodeling.repository');
const { STALE_AFTER_DAYS } = require('../src/config/remodeling');
const pool = require('../src/db/pool');

function parseArgs(argv) {
  const args = argv.slice(2);
  const mode = args.includes('--list') ? 'list' : args.includes('--apply') ? 'apply' : null;

  const daysIndex = args.indexOf('--days');
  const days = daysIndex >= 0 ? Number(args[daysIndex + 1]) : STALE_AFTER_DAYS;

  const applyIndex = args.indexOf('--apply');
  const filePath = applyIndex >= 0 ? args[applyIndex + 1] : null;

  return { mode, days, filePath };
}

function todayLocalDate() {
  return remodelingService.formatLocalDate(new Date());
}

async function runList(days) {
  if (!Number.isFinite(days)) {
    throw new Error('--days 값은 숫자여야 합니다');
  }
  const report = await remodelingService.getStaleReport({ staleAfterDays: days });
  console.log(JSON.stringify(report, null, 2));
}

function printChangelog(changelog) {
  if (changelog.length === 0) {
    console.log('변경된 항목이 없습니다.');
    return;
  }

  console.log(`총 ${changelog.length}건 처리`);
  for (const entry of changelog) {
    const field = entry.fieldKey ? `${entry.fieldName}[${entry.fieldKey}]` : entry.fieldName;
    const before = entry.before === null ? '(없음)' : `'${entry.before}'`;
    const source = entry.sourceName ? `, 출처: ${entry.sourceName}` : '';
    console.log(`[${entry.action}] ${entry.projectName} / ${field}: ${before} -> '${entry.after}' (${entry.reason}${source})`);
  }
}

async function runApply(filePath) {
  if (!filePath) {
    throw new Error('--apply 뒤에 조사 결과 JSON 파일 경로가 필요합니다');
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  const payload = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  const changelog = await remodelingMaintenanceService.applyUpdates({
    repository: remodelingRepository,
    payload,
    today: todayLocalDate()
  });

  printChangelog(changelog);
}

async function main() {
  const { mode, days, filePath } = parseArgs(process.argv);

  if (mode === 'list') {
    await runList(days);
    return;
  }
  if (mode === 'apply') {
    await runApply(filePath);
    return;
  }

  throw new Error('사용법: node scripts/refresh-remodeling-data.js --list [--days 30] | --apply <file.json>');
}

main()
  .catch((err) => {
    console.error('[ERROR] 리모델링 데이터 처리 실패:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
