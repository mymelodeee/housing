const pool = require('../db/pool');

async function findWithinBoundingBox({ minLat, maxLat, minLng, maxLng }) {
  const { rows } = await pool.query(
    'SELECT school_name, latitude, longitude FROM elementary_schools WHERE latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4',
    [minLat, maxLat, minLng, maxLng]
  );
  return rows;
}

async function insertMany(schools) {
  for (const school of schools) {
    await pool.query(
      'INSERT INTO elementary_schools (school_name, latitude, longitude, address) VALUES ($1, $2, $3, $4)',
      [school.schoolName, school.latitude, school.longitude, school.address]
    );
  }
}

async function deleteAll() {
  await pool.query('DELETE FROM elementary_schools');
}

module.exports = { findWithinBoundingBox, insertMany, deleteAll };
