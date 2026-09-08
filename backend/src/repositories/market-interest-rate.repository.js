const pool = require('../db/pool');

async function findCurrent() {
  const { rows } = await pool.query('SELECT * FROM market_interest_rates WHERE id = 1');
  return rows[0] || null;
}

async function updateCurrent({ ratePercent, referencePeriod, sourceName, sourceUrl, checkedAt }) {
  const { rows } = await pool.query(
    `UPDATE market_interest_rates SET
       rate_percent = $1,
       reference_period = $2,
       source_name = $3,
       source_url = $4,
       checked_at = $5,
       updated_at = now()
     WHERE id = 1
     RETURNING *`,
    [ratePercent, referencePeriod, sourceName, sourceUrl, checkedAt]
  );
  return rows[0];
}

module.exports = { findCurrent, updateCurrent };
