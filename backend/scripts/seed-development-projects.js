/**
 * 공식·신뢰 가능한 출처 기반 개발호재 curated dataset을 적재·재검증한다.
 *
 *   node scripts/seed-development-projects.js --list [--stale-days=30]
 *   node scripts/seed-development-projects.js --apply [data/development-projects-seed.json]
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_STALE_DAYS,
  listStaleProjects,
  refreshCuratedProject,
} = require('../src/services/development-projects-maintenance.service');
const pool = require('../src/db/pool');

function parseArguments(args) {
  const staleDaysArgument = args.find((argument) => argument.startsWith('--stale-days='));
  const staleDays = staleDaysArgument ? Number(staleDaysArgument.split('=')[1]) : DEFAULT_STALE_DAYS;
  const filePath = args.find((argument) => !argument.startsWith('--')) || 'data/development-projects-seed.json';
  return { mode: args.includes('--list') ? 'list' : 'apply', staleDays, filePath };
}

async function listStale(staleDays) {
  const projects = await listStaleProjects(staleDays);
  if (projects.length === 0) {
    console.log(`[OK] ${staleDays}일 초과 미검증 개발호재 없음`);
    return;
  }
  for (const project of projects) {
    const checkedAt = project.checked_at instanceof Date
      ? `${project.checked_at.getFullYear()}-${String(project.checked_at.getMonth() + 1).padStart(2, '0')}-${String(project.checked_at.getDate()).padStart(2, '0')}`
      : String(project.checked_at).slice(0, 10);
    console.log(`[STALE] ${checkedAt} ${project.region_name} / ${project.project_name}`);
  }
}

async function applyDataset(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const entries = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  const counts = { inserted: 0, verified: 0, updated: 0, conflicted: 0 };

  for (const entry of entries) {
    const result = await refreshCuratedProject(entry);
    counts[result.action] += 1;
    console.log(`[${result.action.toUpperCase()}] ${entry.regionName} / ${entry.projectName}`);
  }

  console.log(JSON.stringify(counts));
}

async function main() {
  const { mode, staleDays, filePath } = parseArguments(process.argv.slice(2));
  if (!Number.isInteger(staleDays) || staleDays < 1) throw new Error('--stale-days는 1 이상의 정수여야 합니다.');
  if (mode === 'list') await listStale(staleDays);
  else await applyDataset(filePath);
}

main()
  .catch((error) => {
    console.error('[ERROR] 개발호재 유지보수 실패:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
