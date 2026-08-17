const pool = require('../db/pool');

async function findWithinBoundingBox({ minLat, maxLat, minLng, maxLng, schoolLevel }) {
  const params = [minLat, maxLat, minLng, maxLng];
  let sql =
    'SELECT school_name, school_level, latitude, longitude FROM elementary_schools WHERE latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4';

  if (schoolLevel !== undefined) {
    params.push(schoolLevel);
    sql += ' AND school_level = $5';
  }

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function insertMany(schools) {
  for (const school of schools) {
    await pool.query(
      'INSERT INTO elementary_schools (school_name, school_level, latitude, longitude, address) VALUES ($1, $2, $3, $4, $5)',
      [school.schoolName, school.schoolLevel, school.latitude, school.longitude, school.address]
    );
  }
}

async function deleteAll() {
  await pool.query('DELETE FROM elementary_schools');
}

module.exports = { findWithinBoundingBox, insertMany, deleteAll };
