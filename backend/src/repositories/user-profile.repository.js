const pool = require('../db/pool');

async function findById1() {
  const { rows } = await pool.query('SELECT * FROM user_profiles WHERE id = $1', [1]);
  return rows[0] || null;
}

async function update(fields) {
  const { rows } = await pool.query(
    `UPDATE user_profiles SET
       workplace = $1,
       ownership_structure = $2,
       annual_income = $3,
       annual_bonus = $4,
       available_capital = $5,
       housing_ownership_tier = $6,
       is_first_time_buyer = $7
     WHERE id = 1
     RETURNING *`,
    [
      fields.workplace,
      fields.ownership_structure,
      fields.annual_income,
      fields.annual_bonus,
      fields.available_capital,
      fields.housing_ownership_tier,
      fields.is_first_time_buyer
    ]
  );
  return rows[0];
}

module.exports = { findById1, update };
