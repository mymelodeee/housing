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

async function findByPriceRange({ minPrice, maxPrice, minLat, maxLat, minLng, maxLng }) {
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
  `;
  const hasBounds = [minLat, maxLat, minLng, maxLng].every((v) => v !== undefined);
  if (hasBounds) {
    const { rows } = await pool.query(
      `${baseSelect} AND c.latitude BETWEEN $3 AND $4 AND c.longitude BETWEEN $5 AND $6 ORDER BY l.id`,
      [minPrice, maxPrice, minLat, maxLat, minLng, maxLng]
    );
    return rows;
  }
  const { rows } = await pool.query(`${baseSelect} ORDER BY l.id`, [minPrice, maxPrice]);
  return rows;
}

async function findByIdWithComplex(id) {
  const { rows } = await pool.query(
    `SELECT
       l.id, l.complex_id, l.sale_price, l.exclusive_area,
       c.id AS c_id, c.complex_name, c.address, c.completion_year,
       c.remodeling_status, c.reconstruction_status, c.is_regulated_area,
       c.is_land_transaction_permission_zone,
       c.nearest_shuttle_stop_name, c.nearest_shuttle_stop_distance, c.shuttle_commute_minutes,
      c.latitude, c.longitude
     FROM listings l
     JOIN apartment_complexes c ON c.id = l.complex_id
     WHERE l.id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { aggregatePriceRangeByComplexId, findByPriceRange, findByIdWithComplex };
