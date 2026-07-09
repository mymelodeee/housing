const pool = require('../db/pool');

async function insert(userProfileId, listingId) {
  const { rows } = await pool.query(
    'INSERT INTO favorite_listings (user_profile_id, listing_id) VALUES ($1, $2) RETURNING *',
    [userProfileId, listingId]
  );
  return rows[0];
}

async function remove(userProfileId, listingId) {
  const { rows } = await pool.query(
    'DELETE FROM favorite_listings WHERE user_profile_id = $1 AND listing_id = $2 RETURNING id',
    [userProfileId, listingId]
  );
  return rows[0] || null;
}

async function findAllByUserProfileId(userProfileId) {
  const { rows } = await pool.query(
    `SELECT fl.id, fl.user_profile_id, fl.listing_id, fl.registered_at,
            l.id AS l_id, l.complex_id, l.sale_price, l.exclusive_area,
            c.id AS c_id, c.complex_name, c.address, c.completion_year,
            c.remodeling_status, c.reconstruction_status, c.is_regulated_area,
            c.is_land_transaction_permission_zone,
            c.nearest_shuttle_stop_name, c.nearest_shuttle_stop_distance, c.shuttle_commute_minutes
     FROM favorite_listings fl
     JOIN listings l ON l.id = fl.listing_id
     JOIN apartment_complexes c ON c.id = l.complex_id
     WHERE fl.user_profile_id = $1
     ORDER BY fl.id`,
    [userProfileId]
  );
  return rows;
}

module.exports = { insert, remove, findAllByUserProfileId };
