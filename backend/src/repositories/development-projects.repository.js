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

async function insertProject({ complexId, lawdCd, regionName, projectName, category, status, effectiveDate, checkedAt, confidence, note }) {
  const { rows } = await pool.query(
    `INSERT INTO development_projects
       (complex_id, lawd_cd, region_name, project_name, category, status, effective_date, checked_at, confidence, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [complexId ?? null, lawdCd, regionName ?? null, projectName, category, status, effectiveDate ?? null, checkedAt, confidence, note ?? null]
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

async function upsertSource({ projectId, sourceUrl, sourceName, sourceType, sourceDate, checkedAt, reliability, isAccessible }) {
  if (!sourceUrl) {
    return insertSource({ projectId, sourceUrl, sourceName, sourceType, sourceDate, checkedAt, reliability, isAccessible });
  }

  const { rows } = await pool.query(
    `INSERT INTO development_project_sources
       (project_id, source_url, source_name, source_type, source_date, checked_at, reliability, is_accessible)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, true))
     ON CONFLICT (project_id, source_url) WHERE source_url IS NOT NULL
     DO UPDATE SET
       source_name = EXCLUDED.source_name,
       source_type = EXCLUDED.source_type,
       source_date = EXCLUDED.source_date,
       checked_at = EXCLUDED.checked_at,
       reliability = EXCLUDED.reliability,
       is_accessible = EXCLUDED.is_accessible
     RETURNING *`,
    [projectId, sourceUrl, sourceName, sourceType, sourceDate ?? null, checkedAt, reliability, isAccessible ?? null]
  );
  return rows[0];
}

async function findStaleProjects(staleDays = 30) {
  const { rows } = await pool.query(
    `SELECT * FROM development_projects
     WHERE checked_at < CURRENT_DATE - $1::integer
     ORDER BY checked_at ASC, id ASC`,
    [staleDays]
  );
  return rows;
}

async function touchProjectVerification({ projectId, checkedAt, confidence }) {
  const { rows } = await pool.query(
    `UPDATE development_projects
     SET checked_at = $2, confidence = $3, is_conflicted = false, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [projectId, checkedAt, confidence]
  );
  return rows[0] || null;
}

async function markProjectConflict({ projectId, checkedAt }) {
  const { rows } = await pool.query(
    `UPDATE development_projects
     SET checked_at = $2, is_conflicted = true, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [projectId, checkedAt]
  );
  return rows[0] || null;
}

async function replaceProjectWithHistory({ projectId, regionName, category, status, effectiveDate, checkedAt, confidence, note }) {
  const { rows } = await pool.query(
    `WITH archived AS (
       INSERT INTO development_project_history
         (project_id, region_name, category, status, effective_date, checked_at,
          confidence, is_conflicted, note, sources_snapshot, change_reason)
       SELECT p.id, p.region_name, p.category, p.status, p.effective_date, p.checked_at,
              p.confidence, p.is_conflicted, p.note,
              COALESCE(
                jsonb_agg(to_jsonb(s) - 'project_id') FILTER (WHERE s.id IS NOT NULL),
                '[]'::jsonb
              ),
              'curated-refresh'
       FROM development_projects p
       LEFT JOIN development_project_sources s ON s.project_id = p.id
       WHERE p.id = $1
       GROUP BY p.id
       RETURNING project_id
     )
     UPDATE development_projects p
     SET region_name = $2, category = $3, status = $4, effective_date = $5,
         checked_at = $6, confidence = $7, note = $8,
         is_conflicted = false, updated_at = now()
     FROM archived
     WHERE p.id = archived.project_id
     RETURNING p.*`,
    [projectId, regionName ?? null, category, status, effectiveDate ?? null, checkedAt, confidence, note ?? null]
  );
  return rows[0] || null;
}

module.exports = {
  findProjectsForComplex,
  findSourcesByProjectId,
  findProjectByLawdCdAndName,
  findStaleProjects,
  insertProject,
  insertSource,
  upsertSource,
  touchProjectVerification,
  markProjectConflict,
  replaceProjectWithHistory,
};
