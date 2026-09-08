const pool = require('../db/pool');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT id, complex_name, address, completion_year, remodeling_status, reconstruction_status,
            is_regulated_area, is_land_transaction_permission_zone, nearest_shuttle_stop_name,
            nearest_shuttle_stop_distance, shuttle_commute_minutes
     FROM apartment_complexes ORDER BY id`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM apartment_complexes WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findWithinBoundingBox({ minLat, maxLat, minLng, maxLng }) {
  const { rows } = await pool.query(
    'SELECT * FROM apartment_complexes WHERE latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4',
    [minLat, maxLat, minLng, maxLng]
  );
  return rows;
}

async function findPriceHistoryByComplexId(complexId) {
  const { rows } = await pool.query(
    `SELECT transaction_date, transaction_price
     FROM price_history
     WHERE complex_id = $1
     ORDER BY transaction_date ASC`,
    [complexId]
  );
  return rows;
}

async function findByAddress(address) {
  const { rows } = await pool.query('SELECT * FROM apartment_complexes WHERE address = $1', [address]);
  return rows[0] || null;
}

async function insert({
  complexName,
  latitude,
  longitude,
  address,
  completionYear,
  lawdCd,
  molitAptName,
  householdCount,
  buildingCount
}) {
  const { rows } = await pool.query(
    `INSERT INTO apartment_complexes
       (complex_name, latitude, longitude, address, completion_year, lawd_cd, molit_apt_name, household_count, building_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      complexName,
      latitude,
      longitude,
      address,
      completionYear,
      lawdCd,
      molitAptName,
      householdCount === undefined ? null : householdCount,
      buildingCount === undefined ? null : buildingCount
    ]
  );
  return rows[0];
}

module.exports = {
  findAll,
  findById,
  findWithinBoundingBox,
  findPriceHistoryByComplexId,
  findByAddress,
  insert
};
