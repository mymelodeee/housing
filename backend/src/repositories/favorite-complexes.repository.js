const pool = require('../db/pool');

async function insert(userProfileId, complexId) {
  const { rows } = await pool.query(
    'INSERT INTO favorite_complexes (user_profile_id, complex_id) VALUES ($1, $2) RETURNING *',
    [userProfileId, complexId]
  );
  return rows[0];
}

async function remove(userProfileId, complexId) {
  const { rows } = await pool.query(
    'DELETE FROM favorite_complexes WHERE user_profile_id = $1 AND complex_id = $2 RETURNING id',
    [userProfileId, complexId]
  );
  return rows[0] || null;
}

async function findAllByUserProfileId(userProfileId) {
  const { rows } = await pool.query(
    `SELECT fc.id, fc.user_profile_id, fc.complex_id, fc.registered_at,
            c.id AS c_id, c.complex_name, c.address, c.completion_year,
            c.remodeling_status, c.reconstruction_status, c.is_regulated_area,
            c.is_land_transaction_permission_zone,
            c.nearest_shuttle_stop_name, c.nearest_shuttle_stop_distance, c.shuttle_commute_minutes
     FROM favorite_complexes fc
     JOIN apartment_complexes c ON c.id = fc.complex_id
     WHERE fc.user_profile_id = $1
     ORDER BY fc.id`,
    [userProfileId]
  );
  return rows;
}

module.exports = { insert, remove, findAllByUserProfileId };
