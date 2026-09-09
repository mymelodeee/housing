const pool = require('../db/pool');

async function aggregatePriceRangeByComplexId(complexId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count,
            MIN(sale_price) AS min_price,
            MAX(sale_price) AS max_price,
            ROUND(AVG(sale_price))::int AS avg_price
     FROM listings WHERE complex_id = $1`,
    [complexId]
  );
  return rows[0];
}

async function findByPriceRange({ minPrice, maxPrice, minLat, maxLat, minLng, maxLng, targetLawdCds }) {
  const baseSelect = `
    SELECT
      l.id, l.complex_id, l.sale_price, l.exclusive_area,
      c.id AS c_id, c.complex_name, c.address, c.completion_year,
      c.remodeling_status, c.reconstruction_status, c.is_regulated_area,
      c.is_land_transaction_permission_zone,
      c.nearest_shuttle_stop_name, c.nearest_shuttle_stop_distance, c.shuttle_commute_minutes,
      c.latitude, c.longitude
    FROM listings l
    JOIN apartment_complexes c ON c.id = l.complex_id
    WHERE l.sale_price BETWEEN $1 AND $2
      AND ($3::varchar[] IS NULL OR c.lawd_cd = ANY($3::varchar[]))
  `;
  const hasBounds = [minLat, maxLat, minLng, maxLng].every((v) => v !== undefined);
  const lawdCds = targetLawdCds === undefined ? null : targetLawdCds;
  if (hasBounds) {
    const { rows } = await pool.query(
      `${baseSelect} AND c.latitude BETWEEN $4 AND $5 AND c.longitude BETWEEN $6 AND $7 ORDER BY l.id`,
      [minPrice, maxPrice, lawdCds, minLat, maxLat, minLng, maxLng]
    );
    return rows;
  }
  const { rows } = await pool.query(`${baseSelect} ORDER BY l.id`, [minPrice, maxPrice, lawdCds]);
  return rows;
}

async function findByIdWithComplex(id) {
  const { rows } = await pool.query(
    `SELECT
       l.id, l.complex_id, l.sale_price, l.exclusive_area,
       c.id AS c_id, c.complex_name, c.address, c.completion_year,
       c.remodeling_status, c.reconstruction_status, c.is_regulated_area,
       c.is_adjustment_target_area, c.is_speculative_overheated_area,
       c.is_land_transaction_permission_zone,
       c.nearest_shuttle_stop_name, c.nearest_shuttle_stop_distance, c.shuttle_commute_minutes,
      c.latitude, c.longitude, c.lawd_cd, c.molit_apt_name
     FROM listings l
     JOIN apartment_complexes c ON c.id = l.complex_id
     WHERE l.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByComplexAndArea({ complexId, salePrice, exclusiveArea }) {
  const { rows } = await pool.query(
    'SELECT * FROM listings WHERE complex_id = $1 AND sale_price = $2 AND exclusive_area = $3',
    [complexId, salePrice, exclusiveArea]
  );
  return rows[0] || null;
}

async function insert({ complexId, salePrice, exclusiveArea }) {
  const { rows } = await pool.query(
    'INSERT INTO listings (complex_id, sale_price, exclusive_area) VALUES ($1, $2, $3) RETURNING *',
    [complexId, salePrice, exclusiveArea]
  );
  return rows[0];
}

module.exports = {
  aggregatePriceRangeByComplexId,
  findByPriceRange,
  findByIdWithComplex,
  findByComplexAndArea,
  insert
};
