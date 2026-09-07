const pool = require('../db/pool');

const FACT_SELECT = `
  SELECT f.id, f.project_id, f.field_name, f.field_key, f.value, f.value_numeric, f.unit,
         f.value_status, f.effective_date, f.checked_at, f.source_id, f.confidence,
         f.is_current, f.is_conflicted, f.superseded_at,
         s.source_name, s.source_url, s.source_date, s.reliability, s.is_accessible
  FROM remodeling_facts f
  LEFT JOIN remodeling_sources s ON s.id = f.source_id
`;

async function findProjectByComplexId(complexId) {
  const { rows } = await pool.query('SELECT * FROM remodeling_projects WHERE complex_id = $1', [complexId]);
  return rows[0] || null;
}

async function findCurrentFacts(projectId) {
  const { rows } = await pool.query(
    `${FACT_SELECT} WHERE f.project_id = $1 AND f.is_current ORDER BY f.field_name, f.field_key NULLS FIRST`,
    [projectId]
  );
  return rows;
}

async function findFactHistory(projectId) {
  const { rows } = await pool.query(
    `${FACT_SELECT} WHERE f.project_id = $1 AND NOT f.is_current ORDER BY f.superseded_at DESC`,
    [projectId]
  );
  return rows;
}

async function findStageHistory(projectId) {
  const { rows } = await pool.query(
    `SELECT h.id, h.project_id, h.stage, h.effective_date, h.status, h.source_id, h.checked_at, h.note,
            s.source_name, s.source_url, s.source_date, s.reliability
     FROM remodeling_project_history h
     LEFT JOIN remodeling_sources s ON s.id = h.source_id
     WHERE h.project_id = $1
     ORDER BY h.effective_date NULLS LAST, h.id`,
    [projectId]
  );
  return rows;
}

async function findSources(projectId) {
  const { rows } = await pool.query(
    'SELECT * FROM remodeling_sources WHERE project_id = $1 ORDER BY id',
    [projectId]
  );
  return rows;
}

async function findStaleFacts({ staleAfterDays }) {
  const { rows } = await pool.query(
    `SELECT f.id, f.project_id, p.project_name, p.complex_name, p.lawd_cd,
            f.field_name, f.field_key, f.value, f.value_status, f.effective_date, f.checked_at,
            (CURRENT_DATE - f.checked_at)::int AS days_since_checked,
            s.source_name, s.source_url, s.reliability
     FROM remodeling_facts f
     JOIN remodeling_projects p ON p.id = f.project_id
     LEFT JOIN remodeling_sources s ON s.id = f.source_id
     WHERE f.is_current AND f.checked_at < CURRENT_DATE - ($1 || ' days')::interval
     ORDER BY f.checked_at, f.id`,
    [staleAfterDays]
  );
  return rows;
}

async function findStaleStageHistory({ staleAfterDays }) {
  const { rows } = await pool.query(
    `SELECT h.id, h.project_id, p.project_name, p.complex_name, p.lawd_cd,
            h.stage, h.status, h.effective_date, h.checked_at,
            (CURRENT_DATE - h.checked_at)::int AS days_since_checked,
            s.source_name, s.source_url, s.reliability
     FROM remodeling_project_history h
     JOIN remodeling_projects p ON p.id = h.project_id
     LEFT JOIN remodeling_sources s ON s.id = h.source_id
     WHERE h.checked_at < CURRENT_DATE - ($1 || ' days')::interval
     ORDER BY h.checked_at, h.id`,
    [staleAfterDays]
  );
  return rows;
}

async function findStaleSources({ staleAfterDays }) {
  const { rows } = await pool.query(
    `SELECT s.id, s.project_id, p.project_name, p.complex_name, p.lawd_cd,
            s.source_name, s.source_url, s.source_type, s.source_date, s.checked_at,
            s.reliability, s.is_accessible,
            (CURRENT_DATE - s.checked_at)::int AS days_since_checked
     FROM remodeling_sources s
     JOIN remodeling_projects p ON p.id = s.project_id
     WHERE s.checked_at < CURRENT_DATE - ($1 || ' days')::interval
     ORDER BY s.checked_at, s.id`,
    [staleAfterDays]
  );
  return rows;
}

async function upsertProject({ complexId, lawdCd, complexName, regionName, projectName, isActive, lastCheckedAt, note }) {
  const { rows } = await pool.query(
    `INSERT INTO remodeling_projects
       (complex_id, lawd_cd, complex_name, region_name, project_name, is_active, last_checked_at, note)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, true), $7, $8)
     ON CONFLICT (lawd_cd, complex_name) DO UPDATE SET
       complex_id = COALESCE(EXCLUDED.complex_id, remodeling_projects.complex_id),
       region_name = COALESCE(EXCLUDED.region_name, remodeling_projects.region_name),
       project_name = COALESCE(EXCLUDED.project_name, remodeling_projects.project_name),
       is_active = EXCLUDED.is_active,
       last_checked_at = EXCLUDED.last_checked_at,
       note = COALESCE(EXCLUDED.note, remodeling_projects.note),
       updated_at = now()
     RETURNING *`,
    [complexId ?? null, lawdCd, complexName, regionName ?? null, projectName ?? null, isActive ?? null, lastCheckedAt, note ?? null]
  );
  return rows[0];
}

// remodeling_sources에는 UNIQUE 제약이 없으므로(같은 사업에 URL 없는 출처가 여럿 올 수 있음)
// (project_id, url, name) 조합으로 조회 후 갱신/삽입한다.
async function upsertSource({ projectId, sourceUrl, sourceName, sourceTitle, sourceType, sourceDate, checkedAt, reliability, isAccessible }) {
  const { rows: existingRows } = await pool.query(
    `SELECT id FROM remodeling_sources
     WHERE project_id = $1 AND COALESCE(source_url, '') = COALESCE($2, '') AND COALESCE(source_name, '') = COALESCE($3, '')`,
    [projectId, sourceUrl ?? null, sourceName ?? null]
  );

  if (existingRows[0]) {
    const { rows } = await pool.query(
      `UPDATE remodeling_sources
       SET source_title = COALESCE($2, source_title),
           source_type = $3,
           source_date = COALESCE($4, source_date),
           checked_at = $5,
           reliability = $6,
           is_accessible = COALESCE($7, is_accessible)
       WHERE id = $1
       RETURNING *`,
      [existingRows[0].id, sourceTitle ?? null, sourceType, sourceDate ?? null, checkedAt, reliability, isAccessible ?? null]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    `INSERT INTO remodeling_sources
       (project_id, source_url, source_name, source_title, source_type, source_date, checked_at, reliability, is_accessible)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, true))
     RETURNING *`,
    [projectId, sourceUrl ?? null, sourceName ?? null, sourceTitle ?? null, sourceType, sourceDate ?? null, checkedAt, reliability, isAccessible ?? null]
  );
  return rows[0];
}

async function upsertStageHistory({ projectId, stage, effectiveDate, status, sourceId, checkedAt, note }) {
  const { rows } = await pool.query(
    `INSERT INTO remodeling_project_history (project_id, stage, effective_date, status, source_id, checked_at, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (project_id, stage) DO UPDATE SET
       effective_date = COALESCE(EXCLUDED.effective_date, remodeling_project_history.effective_date),
       status = EXCLUDED.status,
       source_id = COALESCE(EXCLUDED.source_id, remodeling_project_history.source_id),
       checked_at = EXCLUDED.checked_at,
       note = COALESCE(EXCLUDED.note, remodeling_project_history.note)
     RETURNING *`,
    [projectId, stage, effectiveDate ?? null, status, sourceId ?? null, checkedAt, note ?? null]
  );
  return rows[0];
}

async function insertFact({ projectId, fieldName, fieldKey, value, valueNumeric, unit, valueStatus, effectiveDate, checkedAt, sourceId, confidence }) {
  const { rows } = await pool.query(
    `INSERT INTO remodeling_facts
       (project_id, field_name, field_key, value, value_numeric, unit, value_status,
        effective_date, checked_at, source_id, confidence)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, 'medium'))
     RETURNING *`,
    [projectId, fieldName, fieldKey ?? null, value, valueNumeric ?? null, unit ?? null, valueStatus,
      effectiveDate ?? null, checkedAt, sourceId ?? null, confidence ?? null]
  );
  return rows[0];
}

async function supersedeFact(id) {
  const { rows } = await pool.query(
    'UPDATE remodeling_facts SET is_current = false, superseded_at = now() WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0] || null;
}

async function touchFactCheckedAt(id, checkedAt) {
  const { rows } = await pool.query(
    'UPDATE remodeling_facts SET checked_at = $2 WHERE id = $1 RETURNING *',
    [id, checkedAt]
  );
  return rows[0] || null;
}

async function markFactConflicted(id) {
  const { rows } = await pool.query(
    'UPDATE remodeling_facts SET is_conflicted = true WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0] || null;
}

async function markSourceInaccessible(id, checkedAt) {
  const { rows } = await pool.query(
    'UPDATE remodeling_sources SET is_accessible = false, checked_at = $2 WHERE id = $1 RETURNING *',
    [id, checkedAt]
  );
  return rows[0] || null;
}

async function findUnlinkedProjects() {
  const { rows } = await pool.query(
    'SELECT * FROM remodeling_projects WHERE complex_id IS NULL ORDER BY id'
  );
  return rows;
}

module.exports = {
  findProjectByComplexId,
  findCurrentFacts,
  findFactHistory,
  findStageHistory,
  findSources,
  findStaleFacts,
  findStaleStageHistory,
  findStaleSources,
  upsertProject,
  upsertSource,
  upsertStageHistory,
  insertFact,
  supersedeFact,
  touchFactCheckedAt,
  markFactConflicted,
  markSourceInaccessible,
  findUnlinkedProjects
};
