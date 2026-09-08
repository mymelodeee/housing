/**
 * 개발호재 수동 조사 결과를 development_projects/development_project_sources에 적재하는 스크립트.
 *
 * 개발호재는 단일 공식 API가 없어(§10) 수동 리서치에 의존한다. 리모델링(refresh-remodeling-data.js)과
 * 달리 아직 값 버전 관리(facts/history) 테이블이 없으므로, 여기서는 (lawd_cd, project_name) 기준으로
 * 이미 있으면 건너뛰고 없으면 새로 추가하는 단순 적재만 수행한다.
 *
 *   node scripts/seed-development-projects.js [data/development-projects-seed.json]
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const developmentProjectsRepository = require('../src/repositories/development-projects.repository');
const pool = require('../src/db/pool');

async function seedProject(entry) {
  const existing = await developmentProjectsRepository.findProjectByLawdCdAndName(entry.lawdCd, entry.projectName);
  if (existing) {
    console.log(`[SKIP] 이미 존재: ${entry.regionName} / ${entry.projectName}`);
    return;
  }

  const project = await developmentProjectsRepository.insertProject({
    lawdCd: entry.lawdCd,
    regionName: entry.regionName,
    projectName: entry.projectName,
    category: entry.category,
    status: entry.status,
    effectiveDate: entry.effectiveDate ?? null,
    checkedAt: entry.checkedAt,
    note: entry.note ?? null
  });

  for (const source of entry.sources ?? []) {
    await developmentProjectsRepository.insertSource({
      projectId: project.id,
      sourceUrl: source.sourceUrl ?? null,
      sourceName: source.sourceName ?? null,
      sourceType: source.sourceType,
      sourceDate: source.sourceDate ?? null,
      checkedAt: entry.checkedAt,
      reliability: source.reliability
    });
  }

  console.log(`[ADD] ${entry.regionName} / ${entry.projectName} (출처 ${entry.sources?.length ?? 0}건)`);
}

async function main() {
  const filePath = process.argv[2] || 'data/development-projects-seed.json';
  const absolutePath = path.resolve(process.cwd(), filePath);
  const entries = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  for (const entry of entries) {
    await seedProject(entry);
  }

  console.log(`총 ${entries.length}건 처리 완료`);
}

main()
  .catch((err) => {
    console.error('[ERROR] 개발호재 시드 실패:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
