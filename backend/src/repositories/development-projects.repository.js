const pool = require('../db/pool');

// 개발호재는 리모델링과 달리 특정 단지 하나가 아니라 인근 지역 전체에 영향을 미치는 경우가
// 대부분이다(예: GTX 역 신설은 반경 수 km 내 여러 단지에 해당). 그래서 complex_id로 직접
// 연결된 사업(향후 특정 단지에 인접한 호재를 명시적으로 지정하고 싶을 때 사용) 외에,
// complex_id가 비어있는 사업은 같은 법정동코드(lawd_cd) 지역이면 모두 노출한다.
async function findProjectsForComplex({ complexId, lawdCd }) {
  const { rows } = await pool.query(
    `SELECT * FROM development_projects
     WHERE complex_id = $1 OR (complex_id IS NULL AND lawd_cd = $2)
     ORDER BY id`,
    [complexId, lawdCd]
  );
  return rows;
}

async function findSourcesByProjectId(projectId) {
  const { rows } = await pool.query(
    'SELECT * FROM development_project_sources WHERE project_id = $1 ORDER BY id',
    [projectId]
  );
  return rows;
}

async function findProjectByLawdCdAndName(lawdCd, projectName) {
  const { rows } = await pool.query(
    'SELECT * FROM development_projects WHERE lawd_cd = $1 AND project_name = $2',
    [lawdCd, projectName]
  );
  return rows[0] || null;
}

async function insertProject({ complexId, lawdCd, regionName, projectName, category, status, effectiveDate, checkedAt, note }) {
  const { rows } = await pool.query(
    `INSERT INTO development_projects
       (complex_id, lawd_cd, region_name, project_name, category, status, effective_date, checked_at, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [complexId ?? null, lawdCd, regionName ?? null, projectName, category, status, effectiveDate ?? null, checkedAt, note ?? null]
  );
  return rows[0];
}

async function insertSource({ projectId, sourceUrl, sourceName, sourceType, sourceDate, checkedAt, reliability, isAccessible }) {
  const { rows } = await pool.query(
    `INSERT INTO development_project_sources
       (project_id, source_url, source_name, source_type, source_date, checked_at, reliability, is_accessible)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, true))
     RETURNING *`,
    [projectId, sourceUrl ?? null, sourceName ?? null, sourceType, sourceDate ?? null, checkedAt, reliability, isAccessible ?? null]
  );
  return rows[0];
}

module.exports = {
  findProjectsForComplex,
  findSourcesByProjectId,
  findProjectByLawdCdAndName,
  insertProject,
  insertSource
};
