const pool = require('../db/pool');

async function upsertEntry({
  lawdCd,
  kaptCode,
  complexName,
  address,
  exclusiveArea,
  salePrice,
  transactionDate,
  householdCount,
  latitude,
  longitude
}) {
  const { rows } = await pool.query(
    `INSERT INTO regional_listing_cache (
       lawd_cd, kapt_code, complex_name, address, exclusive_area, sale_price,
       transaction_date, household_count, latitude, longitude, collected_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
     ON CONFLICT (lawd_cd, complex_name, exclusive_area) DO UPDATE SET
       kapt_code = EXCLUDED.kapt_code,
       address = EXCLUDED.address,
       sale_price = EXCLUDED.sale_price,
       transaction_date = EXCLUDED.transaction_date,
       household_count = EXCLUDED.household_count,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       collected_at = now()
     RETURNING *`,
    [lawdCd, kaptCode, complexName, address, exclusiveArea, salePrice, transactionDate, householdCount, latitude, longitude]
  );
  return rows[0];
}

async function findByFilters({ minPrice, maxPrice, minArea, maxArea, minHouseholdCount }) {
  const { rows } = await pool.query(
    `SELECT * FROM regional_listing_cache
     WHERE sale_price BETWEEN $1 AND $2 AND exclusive_area BETWEEN $3 AND $4
       AND ($5::integer IS NULL OR household_count >= $5)
     ORDER BY id`,
    [minPrice, maxPrice, minArea, maxArea, minHouseholdCount === undefined ? null : minHouseholdCount]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM regional_listing_cache WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findCoordinatesByComplexName({ lawdCd, complexName }) {
  const { rows } = await pool.query(
    `SELECT latitude, longitude FROM regional_listing_cache
     WHERE lawd_cd = $1 AND complex_name = $2 AND latitude IS NOT NULL AND longitude IS NOT NULL
     LIMIT 1`,
    [lawdCd, complexName]
  );
  return rows[0] || null;
}

module.exports = { upsertEntry, findByFilters, findById, findCoordinatesByComplexName };
