const pool = require('../db/pool');

async function findProjectsByComplexId(complexId) {
  const { rows } = await pool.query(
    'SELECT * FROM development_projects WHERE complex_id = $1 ORDER BY id',
    [complexId]
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

module.exports = { findProjectsByComplexId, findSourcesByProjectId };
